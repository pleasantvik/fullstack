import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { JwtModule } from "@nestjs/jwt";
import type { EnvironmentVariables } from "../config/env.validation.js";
import { PrismaModule } from "../prisma/prisma.module.js";
import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";
import { JwtAuthGuard } from "./guards/jwt-auth.guard.js";

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
  providers: [
    AuthService, // what this module can construct

    // Providing APP_GUARD registers JwtAuthGuard for EVERY route in the
    // application - including the task routes in 1.5, which is the point. New
    // routes are protected the moment they exist; exposing one needs @Public().
    //
    // It is declared HERE rather than in AppModule, where the Nest docs put it,
    // because a global guard is still resolved in the context of the module
    // that declares it. JwtAuthGuard needs JwtService, which only exists where
    // JwtModule was registered - this module. AuthModule does not export it.
    //
    // Declared in AppModule, it would fail at boot with "Nest can't resolve
    // dependencies of the JwtAuthGuard (Reflector, ?, PrismaService)" - naming
    // AppModule, where nothing looks wrong, rather than the missing export.
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AuthModule {}
