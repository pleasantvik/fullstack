import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import type { EnvironmentVariables } from "../config/env.validation.js";
import { PrismaModule } from "../prisma/prisma.module.js";
import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";

@Module({
  imports: [
    // what we borrow - it exports PrismaService
    PrismaModule,

    // registerAsync, not register: the secret and lifetime come from
    // ConfigService, which does not exist when this file is read.
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<EnvironmentVariables, true>) => ({
        secret: config.get("JWT_SECRET", { infer: true }),
        signOptions: {
          expiresIn: config.get("JWT_ACCESS_TTL", { infer: true }),
        },
      }),
    }),
  ],
  controllers: [AuthController], // the routes this module exposes
  providers: [AuthService], // what this module can construct
})
export class AuthModule {}
