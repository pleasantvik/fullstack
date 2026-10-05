import { plainToInstance } from "class-transformer";
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  Matches,
  Max,
  Min,
  validateSync,
} from "class-validator";

export enum NodeEnv {
  Development = "development",
  Production = "production",
  Test = "test",
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
