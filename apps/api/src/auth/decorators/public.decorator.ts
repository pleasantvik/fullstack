import { SetMetadata } from "@nestjs/common";

// The key the metadata is stored under. Exported as a constant so the decorator
// that writes it and the guard that reads it cannot drift apart - a mistyped
// string literal in one of them would mean the guard silently never finds the
// marker, and every route would be protected with no explanation.
export const IS_PUBLIC_KEY = "auth:isPublic";

// Marks a route (or a whole controller) as not requiring authentication.
//
// Needed because the guard is registered globally: every route is protected
// unless it opts out. Forgetting this decorator makes a route unreachable,
// which someone reports in minutes. The opposite arrangement - protection
// applied per route - fails the other way, and nobody reports an endpoint that
// works when it should not.
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
