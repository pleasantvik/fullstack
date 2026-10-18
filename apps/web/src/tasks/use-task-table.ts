import { describeError } from "../lib/describe-error";
import { useSetTaskDone } from "./use-set-task-done";
import { useTaskModal } from "./use-task-modal";
import { useTasks } from "./use-tasks";

// Everything the table view needs, already decided: the table components only
// render it.
export function useTaskTable() {
  const tasks = useTasks();
  const { setDone, error: saveError, dismissError } = useSetTaskDone();
  const { openTask } = useTaskModal();

  return {
    isPending: tasks.isPending,
    error: tasks.isError ? describeError(tasks.error) : null,
    retry: () => void tasks.refetch(),
    items: tasks.data?.items ?? [],
    total: tasks.data?.total ?? 0,
    setDone,
    saveError: saveError && `Couldn't save that change, so it was undone. ${saveError}`,
    dismissSaveError: dismissError,
    openTask,
  };
}
