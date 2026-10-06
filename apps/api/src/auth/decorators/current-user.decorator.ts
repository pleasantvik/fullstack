import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import type { AuthenticatedUser } from "../guards/jwt-auth.guard.js";

// Injects the authenticated caller into a handler parameter:
//
//   getMe(@CurrentUser() user: AuthenticatedUser) { ... }
//
// A different mechanism from @Public(). That one attaches metadata for a guard
// to read later; this one produces a VALUE that Nest passes as an argument.
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser => {
    const request = context
      .switchToHttp()
      .getRequest<{ user?: AuthenticatedUser }>();

    // Unreachable on a protected route: the guard runs first and throws 401
    // before any handler is called. Reaching this means the route is @Public()
    // and is asking for a user anyway - a wiring mistake, not a runtime
    // condition.
    //
    // It throws rather than returning undefined deliberately. In 1.5 an
    // undefined user flows into `where: { userId: undefined }`, and Prisma
    // treats an undefined filter as NO filter - so a query meant to return one
    // person's tasks returns everybody's. A 500 now beats a data leak later.
    if (!request.user) {
      throw new Error(
        "@CurrentUser() used on a route the guard did not protect",
      );
    }

    return request.user;
  },
);
