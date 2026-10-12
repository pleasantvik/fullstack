import { QueryCache, QueryClient } from "@tanstack/react-query";
import { ME_KEY } from "../auth/use-me";
import { ApiError } from "./api";

// Retry what might succeed next time, never what can't. A 4xx is the server
// saying the request itself is wrong, and the identical request gets the
// identical answer. Anything that isn't an ApiError is a bug in our own code,
// which retrying won't fix either.
function isTransient(error: unknown): boolean {
  if (!(error instanceof ApiError)) {
    return false;
  }
  const { status } = error;
  return status === 0 || status === 408 || status === 429 || status >= 500;
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    // A 401 that survived api.ts's refresh means the session is gone, whichever
    // query found out. Clearing `me` sends the guard to anonymous - without it,
    // a cached user would keep a page rendered whose data all fails to load.
    onError: (error) => {
      if (error instanceof ApiError && error.status === 401) {
        queryClient.setQueryData(ME_KEY, null);
      }
    },
  }),
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => isTransient(error) && failureCount < 2,
      // Data under 30s old is served from cache without a request. The default
      // is 0: every component mount refetches.
      staleTime: 30_000,
    },
  },
});
