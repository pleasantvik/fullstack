import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../../prisma/prisma.service.js";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator.js";

// What the rest of the application is allowed to know about the caller. Not the
// whole user row - passwordHash must never ride along on the request object.
export interface AuthenticatedUser {
  id: string;
  email: string;
}

// Only the shape this guard touches. Typing it locally avoids pulling in
// @types/express for two fields.
type RequestWithUser = {
  headers: { authorization?: string };
  user?: AuthenticatedUser;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // getAllAndOverride checks the handler first, then the controller class, so
    // a @Public() controller can be overridden by a protected method on it.
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<RequestWithUser>();

    // "Bearer <token>". Anything else - a bare token, Basic auth, a missing
    // header - is not a near miss worth explaining, it is a 401.
    const [scheme, token] = request.headers.authorization?.split(" ") ?? [];
    if (scheme !== "Bearer" || !token) {
      throw new UnauthorizedException();
    }

    let payload: { sub?: string };
    try {
      // Checks the signature AND the exp claim. An expired token fails here,
      // which is the only thing making a 15-minute lifetime mean anything.
      payload = await this.jwt.verifyAsync(token);
    } catch {
      // Deliberately uniform. Expired, forged, malformed and truncated all
      // produce the same 401: telling a caller WHY their token failed tells an
      // attacker which part of their forgery to work on next.
      throw new UnauthorizedException();
    }

    if (!payload.sub) {
      throw new UnauthorizedException();
    }

    // The token is a snapshot of who this was 15 minutes ago. Looking the user
    // up means a deleted account stops working now, rather than whenever its
    // last token happens to expire. One indexed lookup per request is the price.
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true },
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    // The clipboard. Everything past this point can read request.user without
    // parsing a header or touching the database again.
    request.user = user;
    return true;
  }
}
