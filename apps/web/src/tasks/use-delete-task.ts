import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError, api } from "../lib/api";
import { describeError } from "../lib/describe-error";
import { type TaskList, taskKeys } from "./use-tasks";

// Pessimistic: deleting is permanent on the server. The friendlier "hide now,
// Undo for 5 s, then send" pattern needs a deferred request and an action
// toast; not built yet.
export function useDeleteTask(id: string, { onDeleted }: { onDeleted: () => void }) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      try {
        await api.delete(`/tasks/${id}`);
      } catch (error) {
        // Already gone - deleted in another tab. The user's goal is met, so
        // this is a success, not an error to show.
        if (error instanceof ApiError && error.status === 404) return;
        throw error;
      }
    },
    onSuccess: async () => {
      // Close first: unmounts the detail query's observer.
      onDeleted();

      // remove, not invalidate: invalidating refetches a query that still has
      // an observer, and that refetch would be a 404 flashing in the modal.
      queryClient.removeQueries({ queryKey: taskKeys.detail(id), exact: true });

      // Out of every list in the same frame the modal closes, then the server
      // corrects counts and totals.
      queryClient.setQueriesData<TaskList>({ queryKey: taskKeys.lists() }, (list) =>
        list
          ? { ...list, items: list.items.filter((task) => task.id !== id), total: list.total - 1 }
          : list,
      );
      await queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });

  return {
    deleteTask: () => mutation.mutate(),
    isPending: mutation.isPending,
    error: mutation.error ? describeError(mutation.error) : null,
  };
}
