import { describeError } from "../lib/describe-error";
import { groupByStatus, localToday } from "./task-rules";
import { useTaskModal } from "./use-task-modal";
import { useTasks } from "./use-tasks";

// Everything the board view needs, already decided: the board components only
// render it.
export function useTaskBoard() {
  const tasks = useTasks();
  const { openTask } = useTaskModal();

  return {
    isPending: tasks.isPending,
    error: tasks.isError ? describeError(tasks.error) : null,
    retry: () => void tasks.refetch(),
    groups: tasks.data ? groupByStatus(tasks.data.items) : null,
    today: localToday(),
    openTask,
  };
}
