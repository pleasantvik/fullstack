import { LoadError } from "../components/load-error";
import { TaskColumn } from "./task-column";
import { STATUS_ORDER } from "./task-rules";
import { useTaskBoard } from "./use-task-board";

export function TaskBoard() {
  const { isPending, error, retry, groups, today, openTask } = useTaskBoard();

  if (isPending) return <p className="text-sm text-text-muted">Loading tasks...</p>;
  if (error || !groups) return <LoadError message={error ?? ""} onRetry={retry} />;

  return (
    <div className="grid grid-cols-3 gap-3">
      {STATUS_ORDER.map((status) => (
        <TaskColumn
          key={status}
          status={status}
          tasks={groups[status]}
          today={today}
          onOpen={openTask}
        />
      ))}
    </div>
  );
}
