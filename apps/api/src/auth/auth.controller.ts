import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ApiCookieAuth, ApiResponse, ApiTags } from "@nestjs/swagger";
import type { Request, Response } from "express";
import type { EnvironmentVariables } from "../config/env.validation.js";
import {
  clearAuthCookies,
  type CookieSettings,
  REFRESH_COOKIE,
  setAuthCookies,
} from "./auth-cookies.js";
import { AuthService } from "./auth.service.js";
import { CurrentUser } from "./decorators/current-user.decorator.js";
import { Public } from "./decorators/public.decorator.js";
import { LoginDto } from "./dto/login.dto.js";
import { RegisterDto } from "./dto/register.dto.js";
import type { AuthenticatedUser } from "./guards/jwt-auth.guard.js";

// Tokens never appear in a response body - only in httpOnly cookies, so no
// JavaScript ever reads them. AuthService still returns them; turning them into
// cookies happens here, at the HTTP edge, and nowhere else.
//
// passthrough: true on every @Res. Without it Nest stops managing the response
// entirely, the return value is never sent, and the request hangs forever.
@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService<EnvironmentVariables, true>,
  ) {}

  @Public()
  @Post("register")
  @ApiResponse({ status: 409, description: "Email already registered." })
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  // 204: the response is the cookies. There is nothing for a body to say.
  @Public()
  @Post("login")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({
    status: 401,
    description:
      "Wrong password or unknown email. Deliberately indistinguishable - the response must not reveal whether an address is registered.",
  })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    setAuthCookies(res, await this.auth.login(dto), this.cookieSettings());
  }

  // Public because it is called when the access token has expired.
  @Public()
  @Post("refresh")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({
    status: 401,
    description:
      "Missing, unknown, expired or already-used refresh cookie. An already-used one also revokes every other live token for that user.",
  })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const tokens = await this.auth.refresh(req.cookies[REFRESH_COOKIE]);
    setAuthCookies(res, tokens, this.cookieSettings());
  }

  // Public for the same reason as refresh: someone idle for twenty minutes has
  // an expired access token, and must still be able to log out.
  @Public()
  @Post("logout")
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.auth.logout(req.cookies[REFRESH_COOKIE]);
    clearAuthCookies(res, this.config.get("COOKIE_SECURE", { infer: true }));
  }

  // The token is the identity. No id is accepted from the caller.
  @Get("me")
  @ApiCookieAuth()
  @ApiResponse({
    status: 401,
    description: "Missing, malformed, expired, or belonging to a deleted user.",
  })
  currentUser(@CurrentUser() user: AuthenticatedUser) {
    return this.auth.getProfile(user.id);
  }

  private cookieSettings(): CookieSettings {
    return {
      ttl: {
        access: this.config.get("JWT_ACCESS_TTL", { infer: true }),
        refresh: this.config.get("JWT_REFRESH_TTL", { infer: true }),
      },
      secure: this.config.get("COOKIE_SECURE", { infer: true }),
    };
  }
}
