import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from "@nestjs/common";
import { AuthService } from "./auth.service.js";
import { RegisterDto } from "./dto/register.dto.js";
import { LoginDto } from "./dto/login.dto.js";
import { CurrentUser } from "./decorators/current-user.decorator.js";
import { Public } from "./decorators/public.decorator.js";
import type { AuthenticatedUser } from "./guards/jwt-auth.guard.js";
import { RefreshDto } from "./dto/refresh.dto.js";

// Controllers are the edge of the system: route in, call a service, return what
// it gives back. No hashing, no database, no business rules. When this has
// grown to twenty lines, something has leaked into it that belongs elsewhere.
@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  // POST /auth/register
  //
  // Nest returns 201 for POST by default, which is the correct status for
  // "a resource was created" - so no @HttpCode override. 1.4b's login WILL
  // need one, because logging in creates nothing.
  @Public()
  @Post("register")
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }
  // POST /auth/login
  //
  // 200, not the 201 Nest gives POST by default. Logging in creates no
  // resource - it exchanges credentials for a token that already-existing
  // state entitles you to. 201 would be a lie a client might act on.
  @Public()
  @Post("login")
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  // GET /auth/me
  //
  // Returns the authenticated caller.
  //
  // Note what is NOT here: no id in the URL, no body, no parameter the client
  // controls. The token is the identity. The guard has already verified it,
  // looked the user up and put them on the request, so this handler's entire
  // job is to hand back what the guard found.
  //
  // Taking an id from the caller would authenticate them perfectly and then
  // let them read anyone's account - the caller would be claiming an identity
  // rather than proving one.
  //
  // No @HttpCode: GET already returns 200. No service call either - the guard's
  // lookup produced exactly these fields, and calling AuthService here would be
  // a second query for data already in hand.
  @Get("me")
  currentUser(@CurrentUser() user: AuthenticatedUser) {
    return user;
  }

  @Public()
  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto);
  }
}
