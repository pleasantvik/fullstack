import type { CookieOptions, Response } from "express";
import ms, { type StringValue } from "ms";

export const ACCESS_COOKIE = "access_token";
export const REFRESH_COOKIE = "refresh_token";

// `secure` comes from COOKIE_SECURE, which defaults to true and can only be
// switched off by an explicit opt-out - never by NODE_ENV, where a wrong value
// would quietly ship cookies to production without Secure.
const accessOptions = (secure: boolean): CookieOptions => ({
  httpOnly: true,
  secure,
  sameSite: "strict",
  path: "/",
});

// /auth, not /auth/refresh: logout needs this cookie too, to revoke the token
// server-side. Never sent to /tasks.
const refreshOptions = (secure: boolean): CookieOptions => ({
  ...accessOptions(secure),
  path: "/auth",
});

export interface CookieSettings {
  ttl: { access: string; refresh: string };
  secure: boolean;
}

export function setAuthCookies(
  res: Response,
  tokens: { accessToken: string; refreshToken: string },
  { ttl, secure }: CookieSettings,
): void {
  res.cookie(ACCESS_COOKIE, tokens.accessToken, {
    ...accessOptions(secure),
    maxAge: ms(ttl.access as StringValue),
  });
  res.cookie(REFRESH_COOKIE, tokens.refreshToken, {
    ...refreshOptions(secure),
    maxAge: ms(ttl.refresh as StringValue),
  });
}

// The same option builders as above, deliberately. A cookie is only cleared by a
// Set-Cookie naming the path it was set with; clear with a different path and
// the browser keeps the real one, and "logout" leaves you logged in.
export function clearAuthCookies(res: Response, secure: boolean): void {
  res.clearCookie(ACCESS_COOKIE, accessOptions(secure));
  res.clearCookie(REFRESH_COOKIE, refreshOptions(secure));
}
