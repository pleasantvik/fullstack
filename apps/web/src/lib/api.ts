// Relative, the same in every environment: the API is on this page's origin,
// behind Nginx in the image and Vite's dev proxy locally (ADR 0010). Nothing
// environment-specific is baked into the bundle.
const BASE = "/api";

// The only error type the rest of the app ever sees. Whatever library sits
// underneath - fetch today, perhaps something else later - callers catch this.
export class ApiError extends Error {
  readonly status: number;
  readonly requestId: string | null;
  readonly body: unknown;

  constructor(
    status: number,
    message: string,
    requestId: string | null,
    body: unknown,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.requestId = requestId;
    this.body = body;
  }
}

// A 401 from these means wrong credentials or a dead session, never "your access
// token expired" - refreshing and retrying would be pointless or a loop.
const NO_REFRESH = new Set(["/auth/login", "/auth/refresh"]);

let refreshing: Promise<boolean> | null = null;

// Single-flight. Concurrent 401s all await this one promise rather than each
// sending a refresh: every one of them would carry the same refresh cookie, and
// the second to arrive would trip reuse detection and log the user out
// everywhere.
function refreshSession(): Promise<boolean> {
  refreshing ??= fetch(`${BASE}/auth/refresh`, {
    method: "POST",
    credentials: "include",
  })
    .then((res) => res.ok)
    .catch(() => false)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  retried = false,
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...init,
      credentials: "include",
      // Only when there is a body. A Content-Type on a GET makes it a
      // non-simple request, and every read would pay for a CORS preflight.
      headers: init.body ? { "Content-Type": "application/json" } : undefined,
    });
  } catch {
    // fetch rejects only when no HTTP response arrived at all: offline, DNS
    // failure, or a CORS refusal. A 500 does NOT land here.
    throw new ApiError(0, "Could not reach the server", null, null);
  }

  // Safe even for POST and PATCH: a 401 comes from the guard, which runs before
  // the handler, so the original request never executed.
  if (res.status === 401 && !retried && !NO_REFRESH.has(path)) {
    if (await refreshSession()) {
      return request<T>(path, init, true);
    }
  }

  // fetch resolves on 404 and 500. Without this check, an error page's body
  // would be returned to the caller as if it were data.
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const message = Array.isArray(body?.message)
      ? body.message.join(", ")
      : (body?.message ?? res.statusText);
    // Readable cross-origin only because 1.6b exposed it.
    throw new ApiError(
      res.status,
      message,
      res.headers.get("X-Request-Id"),
      body,
    );
  }

  return res.status === 204 ? (undefined as T) : (res.json() as Promise<T>);
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T = void>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "POST",
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: (path: string) => request<void>(path, { method: "DELETE" }),
};
