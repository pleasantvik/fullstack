import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from "@nestjs/common";
import { ApiBearerAuth, ApiResponse, ApiTags } from "@nestjs/swagger";
import { AuthService } from "./auth.service.js";
import { CurrentUser } from "./decorators/current-user.decorator.js";
import { Public } from "./decorators/public.decorator.js";
import { LoginDto } from "./dto/login.dto.js";
import { RefreshDto } from "./dto/refresh.dto.js";
import { RegisterDto } from "./dto/register.dto.js";
import type { AuthenticatedUser } from "./guards/jwt-auth.guard.js";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post("register")
  @ApiResponse({ status: 409, description: "Email already registered." })
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  // 200, not 201: logging in creates no resource.
  @Public()
  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: 401,
    description:
      "Wrong password or unknown email. Deliberately indistinguishable - the response must not reveal whether an address is registered.",
  })
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  // Public because it is called when the access token has expired. Requiring
  // one would make it unusable in the only situation it exists for.
  @Public()
  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: 401,
    description:
      "Unknown, expired, or already-used token. Presenting an already-used token also revokes every other live token for that user.",
  })
  refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto);
  }

  // The token is the identity. No id is accepted from the caller: that would
  // let anyone read any account.
  @Get("me")
  @ApiBearerAuth()
  @ApiResponse({
    status: 401,
    description: "Missing, malformed, expired, or belonging to a deleted user.",
  })
  currentUser(@CurrentUser() user: AuthenticatedUser) {
    return user;
  }
}
