import { describeError } from "../lib/describe-error";
import { type Task, type TaskPriority, type TaskStatus, useTasks } from "./use-tasks";

const STATUS_LABEL: Record<TaskStatus, string> = {
  TODO: "To do",
  IN_PROGRESS: "In progress",
  DONE: "Done",
};

const PRIORITY_LABEL: Record<TaskPriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};

// Built once per module, not once per cell: constructing a formatter loads
// locale data, and a 100-row table would do it 200 times every render.
//
// A due date is a calendar day, stored as midnight UTC. Formatted in local time
// it shows the previous day anywhere west of Greenwich, so it is read in UTC.
// createdAt is a real moment, so it is read in the viewer's own zone.
const dueFormat = new Intl.DateTimeFormat(undefined, {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});
const createdFormat = new Intl.DateTimeFormat(undefined, {
  day: "numeric",
  month: "short",
});

export function TaskTable() {
  const tasks = useTasks();

  // Deliberately naive: the baseline for the CLS measurement in slice 5.
  if (tasks.isPending) {
    return <p className="text-sm text-text-muted">Loading tasks...</p>;
  }

  if (tasks.isError) {
    return (
      <div role="alert" className="text-sm">
        <p className="text-danger">{describeError(tasks.error)}</p>
        <button
          type="button"
          onClick={() => void tasks.refetch()}
          className="mt-2 rounded-lg border border-border px-3 py-1.5"
        >
          Try again
        </button>
      </div>
    );
  }

  const { items, total } = tasks.data;

  if (items.length === 0) {
    return <p className="text-sm text-text-muted">No tasks yet.</p>;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      {/* table-fixed sizes columns from the colgroup alone, without reading any
          cell - long titles truncate instead of pushing the columns around. */}
      <table className="w-full table-fixed text-sm">
        <colgroup>
          <col />
          <col className="w-[132px]" />
          <col className="w-[110px]" />
          <col className="w-[132px]" />
          <col className="w-[110px]" />
        </colgroup>
        <thead className="bg-surface-muted text-left text-label text-text-muted">
          <tr className="h-11">
            <th scope="col" className="px-4 font-medium">Task</th>
            <th scope="col" className="px-4 font-medium">Status</th>
            <th scope="col" className="px-4 font-medium">Priority</th>
            <th scope="col" className="px-4 font-medium">Due</th>
            <th scope="col" className="px-4 font-medium">Created</th>
          </tr>
        </thead>
        <tbody>
          {items.map((task) => (
            <TaskRow key={task.id} task={task} />
          ))}
        </tbody>
      </table>

      {total > items.length && (
        <p className="border-t border-border px-4 py-2 text-label text-text-muted">
          Showing {items.length} of {total} tasks.
        </p>
      )}
    </div>
  );
}

function TaskRow({ task }: { task: Task }) {
  return (
    <tr className="h-11 border-t border-border">
      <td className="truncate px-4" title={task.title}>
        {task.title}
      </td>
      <td className="px-4">{STATUS_LABEL[task.status]}</td>
      <td className="px-4">{PRIORITY_LABEL[task.priority]}</td>
      <td className="px-4">
        {task.dueDate ? dueFormat.format(new Date(task.dueDate)) : "-"}
      </td>
      <td className="px-4 text-text-muted">
        {createdFormat.format(new Date(task.createdAt))}
      </td>
    </tr>
  );
}
