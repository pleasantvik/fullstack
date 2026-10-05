import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { validate } from "./config/env.validation.js";

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
  ],
})
export class AppModule {}
