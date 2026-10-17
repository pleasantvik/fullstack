import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { TASKS_KEY, type Task } from "./use-tasks";

export function useSetTaskDone() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    // The value the user wants, not "flip it": a double click sends DONE twice
    // and lands on DONE, where a toggle would undo itself.
    mutationFn: ({ id, done }: { id: string; done: boolean }) =>
      api.patch<Task>(`/tasks/${id}`, { status: done ? "DONE" : "TODO" }),

    // Returned, so the mutation stays pending until the refetch has landed.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TASKS_KEY }),
  });

  return {
    setDone: (id: string, done: boolean) => mutation.mutate({ id, done }),
    pendingId: mutation.isPending ? mutation.variables?.id : undefined,
  };
}
