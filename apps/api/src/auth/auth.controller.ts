import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { AuthService } from "./auth.service.js";
import { RegisterDto } from "./dto/register.dto.js";
import { LoginDto } from "./dto/login.dto.js";

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
  @Post("register")
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }
  // POST /auth/login
  //
  // 200, not the 201 Nest gives POST by default. Logging in creates no
  // resource - it exchanges credentials for a token that already-existing
  // state entitles you to. 201 would be a lie a client might act on.
  @Post("login")
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }
}
