import { PRIORITY_LABEL, dueFormat } from "./task-format";
import { isOverdue } from "./task-rules";
import type { Task, TaskPriority } from "./use-tasks";

const PRIORITY_CHIP: Record<TaskPriority, string> = {
  HIGH: "border-danger text-danger",
  MEDIUM: "border-warning text-warning",
  LOW: "border-border text-text-muted",
};

export function TaskCard({
  task,
  today,
  onOpen,
}: {
  task: Task;
  today: string;
  onOpen: (id: string) => void;
}) {
  const overdue = isOverdue(task, today);

  return (
    // The whole card is the button: one Tab stop per task, Enter or Space opens
    // it, and the dialog returns focus here on close.
    <li>
      <button
        type="button"
        onClick={() => onOpen(task.id)}
        className="w-full rounded-lg border border-border bg-surface p-3 text-left hover:border-text-muted"
      >
        {/* Spans, not p/div: a button may only contain phrasing content. */}
        <span className="block text-sm break-words">{task.title}</span>
        <span className="mt-2 flex items-center gap-2 text-label">
          <span className={`rounded-full border px-2 ${PRIORITY_CHIP[task.priority]}`}>
            {PRIORITY_LABEL[task.priority]}
          </span>
          {task.dueDate && (
            <span className={overdue ? "text-danger" : "text-text-muted"}>
              {overdue && "Overdue · "}
              {dueFormat.format(new Date(task.dueDate))}
            </span>
          )}
        </span>
      </button>
    </li>
  );
}
