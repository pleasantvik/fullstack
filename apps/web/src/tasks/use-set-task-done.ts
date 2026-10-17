import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { describeError } from "../lib/describe-error";
import { TASKS_KEY, type Task, type TaskList, type TaskStatus } from "./use-tasks";

type Vars = { id: string; done: boolean };

export function useSetTaskDone() {
  const queryClient = useQueryClient();

  // Every cached list under the prefix, not one key: the same task can sit in
  // more than one list once lists take parameters. Touches one task only, so a
  // second click's change on another row is never caught up in this one.
  function writeStatus(id: string, status: TaskStatus) {
    queryClient.setQueriesData<TaskList>({ queryKey: TASKS_KEY }, (list) =>
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
      // land, it would overwrite the optimistic write with the old status.
      await queryClient.cancelQueries({ queryKey: TASKS_KEY });

      // Only this task's status is remembered, not the whole list. Restoring a
      // whole-list snapshot would also undo any other row changed since.
      const previousStatus = queryClient
        .getQueriesData<TaskList>({ queryKey: TASKS_KEY })
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
    onSettled: () => queryClient.invalidateQueries({ queryKey: TASKS_KEY }),
  });

  return {
    setDone: (id: string, done: boolean) => mutation.mutate({ id, done }),
    error: mutation.error ? describeError(mutation.error) : null,
    dismissError: mutation.reset,
  };
}
