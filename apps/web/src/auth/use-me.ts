import { useQuery } from "@tanstack/react-query";
import { ApiError, api } from "../lib/api";

export interface User {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
}

export const ME_KEY = ["auth", "me"] as const;

// "Not logged in" is an ANSWER, so a 401 resolves to null rather than throwing.
// Only failures meaning "couldn't find out" - offline, a 500 - stay errors.
// Keeping those apart matters: an unreachable API is not a reason to show a
// login form, which would then fail too.
export function useMe() {
  return useQuery({
    queryKey: ME_KEY,
    queryFn: async (): Promise<User | null> => {
      try {
        return await api.get<User>("/auth/me");
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          return null;
        }
        throw error;
      }
    },
    // Who you are doesn't change between page navigations. Without this, every
    // route change would ask again.
    staleTime: 5 * 60_000,
  });
}
