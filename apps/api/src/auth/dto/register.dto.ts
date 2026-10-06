import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

export class RegisterDto {
  // Required here although the column is nullable. Three users predate it and
  // keep NULL; everyone from now on has one. Widen the database, tighten the
  // API - not the other way round.
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

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
