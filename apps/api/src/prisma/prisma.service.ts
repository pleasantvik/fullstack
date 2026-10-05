import {
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";
import type { EnvironmentVariables } from "../config/env.validation.js";

// The only PrismaClient in the application. One instance, one connection pool.
//
// Extending PrismaClient rather than wrapping it means the generated model API
// comes through untouched: this.task.findMany(), not this.client.task.findMany().
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor(config: ConfigService<EnvironmentVariables, true>) {
    // Prisma 7 no longer connects on its own - it requires a driver adapter.
    // PrismaPg owns the `pg` connection pool underneath.
    //
    // The connection string comes from ConfigService, not process.env, so it
    // has already passed the boot-time validation in 1.3b. Reading process.env
    // here would route around the manifest.
    super({
      adapter: new PrismaPg({
        connectionString: config.get("DATABASE_URL", { infer: true }),
      }),
    });
  }

  // Prisma connects lazily on first query. Connecting here instead means a bad
  // password or an unreachable database fails at startup rather than on
  // whichever request happens to be first - the same fail-fast argument as 1.3b,
  // applied to the thing config validation cannot check.
  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log("Database connection established");
  }

  // Called on SIGTERM, but only once main.ts enables shutdown hooks. Without
  // that, a container killed during a deploy dies still holding its connections.
  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.log("Database connection closed");
  }
}
