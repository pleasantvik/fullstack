import { IsEmail, IsString, MaxLength } from "class-validator";

// The contract for POST /auth/login.
//
// The global ValidationPipe registered in 1.3b checks every incoming body
// against the DTO for that route..
export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MaxLength(128)
  password: string;
}
