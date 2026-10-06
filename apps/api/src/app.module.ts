import { randomUUID } from "node:crypto";
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { LoggerModule } from "nestjs-pino";
import {
  NodeEnv,
  validate,
  type EnvironmentVariables,
} from "./config/env.validation.js";
import { HealthModule } from "./health/health.module.js";
import { PrismaModule } from "./prisma/prisma.module.js";
import { TasksModule } from "./tasks/tasks.module.js";
import { AuthModule } from "./auth/auth.module.js";

@Module({
  imports: [
    ConfigModule.forRoot({
      // ConfigService is available everywhere without each module importing
      // this one. Config is genuinely global - this is the case the flag is for.
      isGlobal: true,

      // The repo root, two levels up: docker-compose.yml needs the same file,
      // so it stays in one place. In 1.7 the container receives real
      // environment variables and this path simply won't resolve, which is
      // harmless - a missing env file is not an error.
      envFilePath: "../../.env",

      validate,
    }),

    // forRootAsync, not forRoot: this module's options depend on LOG_LEVEL and
    // NODE_ENV, which do not exist until ConfigModule has loaded and validated
    // them. A plain object would have to be built at import time, before that.
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<EnvironmentVariables, true>) => {
        const isDev =
          config.get("NODE_ENV", { infer: true }) === NodeEnv.Development;

        return {
          pinoHttp: {
            level: config.get("LOG_LEVEL", { infer: true }),

            // The wristband. Reuse an id the caller already has, so a request
            // traced through Nginx (1.9) or a load balancer (Milestone 4) keeps
            // one identity end to end. Only mint a new one when nobody upstream
            // has. Echoing it back lets a client quote it in a bug report.
            genReqId: (req, res) => {
              const existing = req.headers["x-request-id"];
              const id = typeof existing === "string" ? existing : randomUUID();
              res.setHeader("X-Request-Id", id);
              return id;
            },

            // Never log credentials. These headers exist on every request and
            // would otherwise be written in full to disk, and to the log
            // aggregator in Milestone 5.
            redact: ["req.headers.authorization", "req.headers.cookie"],

            // Readable locally, machine-parseable everywhere else. pino-pretty
            // is a dev dependency and must never reach the production image.
            transport: isDev
              ? { target: "pino-pretty", options: { singleLine: true } }
              : undefined,
          },
        };
      },
    }),

    PrismaModule,
    AuthModule,
    TasksModule,
    HealthModule,
  ],
})
export class AppModule {}
