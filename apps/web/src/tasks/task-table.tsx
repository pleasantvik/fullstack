import { Toast } from "../components/toast";
import { describeError } from "../lib/describe-error";
import { dueFormat, PRIORITY_LABEL, STATUS_LABEL } from "./task-format";
import { useSetTaskDone } from "./use-set-task-done";
import { useTaskModal } from "./use-task-modal";
import { type Task, useTasks } from "./use-tasks";

// Built once per module, not once per cell: constructing a formatter loads
// locale data, and a 100-row table would do it 100 times every render.
// createdAt is a real moment, so it is read in the viewer's own zone.
const createdFormat = new Intl.DateTimeFormat(undefined, {
  day: "numeric",
  month: "short",
});

export function TaskTable() {
  const tasks = useTasks();
  const { setDone, error: saveError, dismissError } = useSetTaskDone();
  const { openTask } = useTaskModal();

  // Plain text, no skeleton: the table appearing in its place is new content,
  // not moved content, so it costs no CLS (measured at 0.00 in 1.6f).
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
    <>
      <Toast
        message={saveError && `Couldn't save that change, so it was undone. ${saveError}`}
        onDismiss={dismissError}
      />
      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        {/* table-fixed sizes columns from the colgroup alone, without reading any
            cell - long titles truncate instead of pushing the columns around. */}
        <table className="w-full table-fixed text-sm">
          <colgroup>
            <col className="w-11" />
            <col />
            <col className="w-[132px]" />
            <col className="w-[110px]" />
            <col className="w-[132px]" />
            <col className="w-[110px]" />
          </colgroup>
          <thead className="bg-surface-muted text-left text-label text-text-muted">
            <tr className="h-11">
              <th scope="col" className="pl-4">
                <span className="sr-only">Done</span>
              </th>
              <th scope="col" className="px-4 font-medium">
                Task
              </th>
              <th scope="col" className="px-4 font-medium">
                Status
              </th>
              <th scope="col" className="px-4 font-medium">
                Priority
              </th>
              <th scope="col" className="px-4 font-medium">
                Due
              </th>
              <th scope="col" className="px-4 font-medium">
                Created
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((task) => (
              <TaskRow key={task.id} task={task} onSetDone={setDone} onOpen={openTask} />
            ))}
          </tbody>
        </table>
  
        {total > items.length && (
          <p className="border-t border-border px-4 py-2 text-label text-text-muted">
            Showing {items.length} of {total} tasks.
          </p>
        )}
      </div>
    </>
  );
}

function TaskRow({
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
      <td className="px-4">
        {task.dueDate ? dueFormat.format(new Date(task.dueDate)) : "-"}
      </td>
      <td className="px-4 text-text-muted">
        {createdFormat.format(new Date(task.createdAt))}
      </td>
    </tr>
  );
}
