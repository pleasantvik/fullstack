import { IsNotEmpty, IsString, MaxLength } from "class-validator";

// The contract for POST /auth/refresh.
//
// Deliberately loose. A refresh token is a 32-byte random value this API
// generated, so there is no format worth asserting beyond "a plausible string" -
// and over-specific validation would answer "what does a real token look like?"
// with a 400 instead of a 401.
export class RefreshDto {
  @IsString()
  @IsNotEmpty()
  // A sanity bound, not a precise one: real tokens are 43 characters. Nothing
  // unauthenticated should accept unbounded input - same reason as `password`.
  @MaxLength(256)
  refreshToken: string;
}
