import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { describeError } from "../lib/describe-error";
import { type Task, type TaskList, type TaskStatus, taskKeys } from "./use-tasks";

type Vars = { id: string; done: boolean };

export function useSetTaskDone() {
  const queryClient = useQueryClient();

  // Lists only: a detail query under the same "tasks" prefix holds a Task, not
  // a TaskList, and this updater would throw on it. Every list, though - the
  // same task can sit in more than one once lists take parameters. Touches one
  // task only, so a second click's change on another row is never caught up.
  function writeStatus(id: string, status: TaskStatus) {
    queryClient.setQueriesData<TaskList>({ queryKey: taskKeys.lists() }, (list) =>
      list
        ? {
            ...list,
            items: list.items.map((task) => (task.id === id ? { ...task, status } : task)),
          }
        : list,
    );
  }

  const mutation = useMutation({
    // The value the user wants, not "flip it": a double click sends DONE twice
    // and lands on DONE, where a toggle would undo itself.
    mutationFn: ({ id, done }: Vars) =>
      api.patch<Task>(`/tasks/${id}`, { status: done ? "DONE" : "TODO" }),

    onMutate: async ({ id, done }) => {
      // A refetch already in flight was answered before this click. Left to
      // land, it would overwrite the optimistic write with the old status - a
      // detail refetch of this task as much as a list one, hence all.
      await queryClient.cancelQueries({ queryKey: taskKeys.all });

      // Only this task's status is remembered, not the whole list. Restoring a
      // whole-list snapshot would also undo any other row changed since.
      const previousStatus = queryClient
        .getQueriesData<TaskList>({ queryKey: taskKeys.lists() })
        .flatMap(([, list]) => list?.items ?? [])
        .find((task) => task.id === id)?.status;

      writeStatus(id, done ? "DONE" : "TODO");
      return { id, previousStatus };
    },

    onError: (_error, _vars, context) => {
      if (context?.previousStatus) writeStatus(context.id, context.previousStatus);
    },

    // Success or failure, the server has the last word: whatever the
    // optimistic write guessed wrong (updatedAt, at least) gets corrected.
    // All, not lists: a cached detail of this task is stale too, and its
    // initialData will not run again to fix it.
    onSettled: () => queryClient.invalidateQueries({ queryKey: taskKeys.all }),
  });

  return {
    setDone: (id: string, done: boolean) => mutation.mutate({ id, done }),
    error: mutation.error ? describeError(mutation.error) : null,
    dismissError: mutation.reset,
  };
}
