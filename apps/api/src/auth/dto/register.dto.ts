import { IsEmail, IsString, MaxLength, MinLength } from "class-validator";

// The contract for POST /auth/register.
//
// The global ValidationPipe registered in 1.3b checks every incoming body
// against the DTO for that route. Until now there were no DTOs, so it did
// nothing. This is the first.
export class RegisterDto {
  @IsEmail()
  email: string;

  // Length, not character classes. Current guidance (NIST SP 800-63B) dropped
  // mandatory uppercase/symbol rules: they push people towards Passw0rd! and
  // measurably reduce entropy. Length is what actually costs an attacker.
  @IsString()
  @MinLength(12)
  // Not cosmetic. argon2 is deliberately expensive, so hashing is the most
  // costly thing this endpoint does. Without a ceiling, a 10 MB "password"
  // becomes a cheap way to exhaust the server's CPU and memory - the work
  // factor that protects users becomes the weapon.
  @MaxLength(128)
  password: string;
}
