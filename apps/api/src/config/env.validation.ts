import { plainToInstance } from "class-transformer";
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  Matches,
  Max,
  Min,
  MinLength,
  validateSync,
} from "class-validator";

export enum NodeEnv {
  Development = "development",
  Production = "production",
  Test = "test",
}
export enum LogLevel {
  Error = "error",
  Warn = "warn",
  Info = "info",
  Debug = "debug",
  Trace = "trace",
  Silent = "silent",
  Fatal = "fatal",
}

// The manifest. Every environment variable this service requires, with the
// shape it must have. Nothing reads configuration that isn't declared here.
//
// Defaults matter: a variable with one is optional, a variable without one is
// mandatory. DATABASE_URL has no default, so its absence stops the process.
export class EnvironmentVariables {
  @IsEnum(NodeEnv)
  NODE_ENV: NodeEnv = NodeEnv.Development;

  @IsInt()
  @Min(1)
  @Max(65535)
  PORT: number = 3000;

  @IsNotEmpty()
  @Matches(/^postgresql:\/\/.+/, {
    message: "DATABASE_URL must be a postgresql:// connection string",
  })
  DATABASE_URL: string;

  @IsEnum(LogLevel)
  LOG_LEVEL: LogLevel = LogLevel.Info;

  // No default, deliberately. A default would live in a public repo, letting
  // anyone forge a token for any user - and the app would start normally, which
  // is what makes it worse than a missing variable.
  //
  // 32 is a floor, not a target. The signature is an HMAC, and checking a
  // guessed secret costs one cheap hash - there is no argon2 in the way, so a
  // short secret makes the password hashing irrelevant. Generate, never type:
  //   node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
  @IsNotEmpty()
  @MinLength(32)
  JWT_SECRET: string;

  // Format is checked by @nestjs/jwt at sign time, not here, so an unparseable
  // value fails on the first login rather than at boot. A deliberate gap in the
  // fail-fast guarantee: tighten with @Matches if it ever bites.
  @IsNotEmpty()
  JWT_ACCESS_TTL: string = "15m";
}

// Runs during module initialisation - before the HTTP server binds a port.
// Throwing here stops the process, which is the entire point of the increment.
export function validate(raw: Record<string, unknown>): EnvironmentVariables {
  // enableImplicitConversion turns PORT="3000" into the number 3000. Every
  // environment variable is a string; converting once at the boundary means
  // nothing downstream has to remember to parse it.
  const parsed = plainToInstance(EnvironmentVariables, raw, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(parsed, { skipMissingProperties: false });

  if (errors.length > 0) {
    const detail = errors
      .map(
        (e) =>
          `  ${e.property}: ${Object.values(e.constraints ?? {}).join(", ")}`,
      )
      .join("\n");

    throw new Error(`Invalid environment configuration:\n${detail}\n`);
  }

  return parsed;
}
