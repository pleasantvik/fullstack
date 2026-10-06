import { createHash, randomBytes } from "node:crypto";
import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { hash, hashSync, verify } from "@node-rs/argon2";
import ms, { type StringValue } from "ms";
import { Prisma } from "../generated/prisma/client.js";
import { PrismaService } from "../prisma/prisma.service.js";
import type { EnvironmentVariables } from "../config/env.validation.js";
import type { LoginDto } from "./dto/login.dto.js";
import type { RefreshDto } from "./dto/refresh.dto.js";
import type { RegisterDto } from "./dto/register.dto.js";

// OWASP's minimum recommended argon2id parameters.
//
// `algorithm` is deliberately absent: argon2id is the library default, and the
// Algorithm enum is an ambient const enum, which `isolatedModules: true`
// forbids importing across modules.
//
// These numbers are a budget, not a magic constant. Raising memoryCost makes
// every login slower for users and every guess more expensive for an attacker.
// They are stored inside the hash itself, so changing them later does not
// invalidate existing passwords - old hashes keep verifying with their own.
const ARGON2 = {
  memoryCost: 19456, // 19 MiB per hash
  timeCost: 2, // passes over memory
  parallelism: 1, // threads, each with its own 19 MiB
};

// A real argon2id hash of a random string nobody will ever submit. Computed
// once at startup so that a login for an unknown email still has something to
// verify against, and therefore still costs the same.
//
// Without it, "no such user" returns in under a millisecond while a real email
// takes ~50ms, and anyone can discover who has an account by timing it.
const ABSENT_USER_HASH = hashSync(
  randomBytes(32).toString("base64url"),
  ARGON2,
);

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService<EnvironmentVariables, true>,
  ) {}

  async register(dto: RegisterDto) {
    // Hash BEFORE touching the database, not after checking for a duplicate.
    //
    // This does NOT hide which emails are registered - the 409 below says so
    // outright. That is a deliberate tradeoff: clear feedback for a user who
    // already has an account, at the cost of letting anyone enumerate
    // addresses. Returning 201 either way would close the leak and require
    // email sending to be usable, which does not exist until Milestone 2.
    //
    // The ordering is kept because login in 1.4b must do the same thing, and
    // there it IS the defence: a login that skips hashing for an unknown email
    // answers faster, and response time becomes an oracle. No message gives it
    // away there, so timing is all an attacker has. Same shape, same habit.
    const passwordHash = await hash(dto.password, ARGON2);

    try {
      return await this.prisma.user.create({
        data: {
          // Normalised, so Ada@example.com and ada@example.com cannot both
          // register. The unique constraint is on the stored value, and
          // Postgres compares case-sensitively.
          email: dto.email.toLowerCase(),
          name: dto.name,
          passwordHash,
        },
        // Explicit select, never the whole row. Without this, passwordHash is
        // returned to the client and written to any log that records the
        // response body.
        select: { id: true, email: true, name: true, createdAt: true },
      });
    } catch (error) {
      // P2002 is Prisma's unique constraint violation - here, the email index.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictException("Email already registered");
      }
      throw error;
    }
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      select: { id: true, passwordHash: true },
    });

    // Verify unconditionally, against a throwaway hash when there is no user.
    // Skipping the work for an unknown email is the obvious optimisation and
    // the whole vulnerability: the response comes back faster, and response
    // time becomes a free "does this person have an account?" lookup.
    const valid = await verify(
      user?.passwordHash ?? ABSENT_USER_HASH,
      dto.password,
      ARGON2,
    );

    // One message for both failures. "No such user" and "wrong password" are
    // different facts, and telling them apart hands an attacker a list of
    // registered emails to go and work on.
    if (!user || !valid) {
      throw new UnauthorizedException("Invalid email or password");
    }

    // `sub` - subject - is the registered claim for "who this token is about",
    // and it is the ONLY thing in the payload. Claims are readable by anyone
    // holding the token, so email, name and roles stay out: they would travel
    // into every log, browser history entry and error report the token reaches.
    //
    // It also keeps the token honest. Anything copied in here is a snapshot of
    // the world when the token was issued, and stays true to the API for the
    // token's whole life, even after the real value changes.
    return this.issueTokens(user.id);
  }

  async refresh(dto: RefreshDto) {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: this.hashToken(dto.refreshToken) },
      select: { id: true, userId: true, expiresAt: true, revokedAt: true },
    });

    if (!stored) {
      throw new UnauthorizedException();
    }

    // A token that was already retired is a second copy in circulation. We
    // cannot tell which holder is the real user, so neither keeps anything.
    if (stored.revokedAt) {
      await this.revokeAll(stored.userId);
      throw new UnauthorizedException();
    }

    if (stored.expiresAt <= new Date()) {
      throw new UnauthorizedException();
    }

    // Conditional update rather than read-then-write: two requests racing with
    // the same token both passed the check above, and the database decides
    // which one actually retires it. The loser sees count 0, which is reuse.
    const { count } = await this.prisma.refreshToken.updateMany({
      where: { id: stored.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    if (count === 0) {
      await this.revokeAll(stored.userId);
      throw new UnauthorizedException();
    }

    return this.issueTokens(stored.userId);
  }

  private async issueTokens(userId: string) {
    const refreshToken = randomBytes(32).toString("base64url");
    const ttl = this.config.get("JWT_REFRESH_TTL", { infer: true });

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: this.hashToken(refreshToken),
        expiresAt: new Date(Date.now() + ms(ttl as StringValue)),
      },
    });

    return {
      accessToken: await this.jwt.signAsync({ sub: userId }),
      refreshToken,
    };
  }

  // SHA-256, not argon2. argon2 is slow because passwords are guessable; a
  // 32-byte random token has nothing to guess. And argon2 salts every hash, so
  // the same token would hash differently each time and could never be looked
  // up - this has to be an indexed equality match.
  private hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  private async revokeAll(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  // The guard attaches only what authorisation needs - id and email. Anything a
  // handler wants as DATA is fetched here instead, so the request object does
  // not drift into a general-purpose cache of user fields.
  async getProfile(userId: string) {
    return this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { id: true, email: true, name: true, createdAt: true },
    });
  }
}
