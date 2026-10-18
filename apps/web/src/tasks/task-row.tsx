import { PRIORITY_LABEL, STATUS_LABEL, createdFormat, dueFormat } from "./task-format";
import type { Task } from "./use-tasks";

export function TaskRow({
  task,
  onSetDone,
  onOpen,
}: {
  task: Task;
  onSetDone: (id: string, done: boolean) => void;
  onOpen: (id: string) => void;
}) {
  return (
    <tr className="h-11 border-t border-border">
      <td className="pl-4">
        {/* Controlled by the cache, which useSetTaskDone writes before the
            PATCH answers - never by the checkbox's own state. */}
        <input
          type="checkbox"
          checked={task.status === "DONE"}
          onChange={(e) => onSetDone(task.id, e.target.checked)}
          aria-label={`Done: ${task.title}`}
          className="size-4 accent-accent"
        />
      </td>
      {/* A button, not an onClick on the cell: reachable with Tab, activated by
          Enter and Space, and announced as clickable. The dialog returns focus
          here on close. */}
      <td className="px-4">
        <button
          type="button"
          onClick={() => onOpen(task.id)}
          title={task.title}
          className="block w-full truncate text-left hover:underline"
        >
          {task.title}
        </button>
      </td>
      <td className="px-4">{STATUS_LABEL[task.status]}</td>
      <td className="px-4">{PRIORITY_LABEL[task.priority]}</td>
      <td className="px-4">{task.dueDate ? dueFormat.format(new Date(task.dueDate)) : "-"}</td>
      <td className="px-4 text-text-muted">{createdFormat.format(new Date(task.createdAt))}</td>
    </tr>
  );
}
