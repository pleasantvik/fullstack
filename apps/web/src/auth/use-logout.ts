import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { api } from "../lib/api";
import { describeError } from "../lib/describe-error";
import { ME_KEY } from "./use-me";

export function useLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: () => api.post("/auth/logout"),
    onSuccess: () => {
      // Everything cached belongs to the user who just left - their tasks
      // included. On a shared computer the next person must not see any of it,
      // even for the moment before their own data loads.
      queryClient.clear();
      // Then seed "anonymous". Order matters: the other way round, clear()
      // deletes this too, and every still-mounted query asks the server again.
      queryClient.setQueryData(ME_KEY, null);
      navigate("/login", { replace: true });
    },
  });

  return {
    logout: () => mutation.mutate(),
    isPending: mutation.isPending,
    error: mutation.error ? describeError(mutation.error) : null,
  };
}
