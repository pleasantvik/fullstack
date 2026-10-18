import { LoadError } from "../components/load-error";
import { Toast } from "../components/toast";
import { TaskRow } from "./task-row";
import { useTaskTable } from "./use-task-table";

export function TaskTable() {
  const {
    isPending,
    error,
    retry,
    items,
    total,
    setDone,
    saveError,
    dismissSaveError,
    openTask,
  } = useTaskTable();

  // Plain text, no skeleton: the table appearing in its place is new content,
  // not moved content, so it costs no CLS (measured at 0.00 in 1.6f).
  if (isPending) return <p className="text-sm text-text-muted">Loading tasks...</p>;
  if (error) return <LoadError message={error} onRetry={retry} />;
  if (items.length === 0) return <p className="text-sm text-text-muted">No tasks yet.</p>;

  return (
    <>
      <Toast message={saveError} onDismiss={dismissSaveError} />
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
              <th scope="col" className="px-4 font-medium">Task</th>
              <th scope="col" className="px-4 font-medium">Status</th>
              <th scope="col" className="px-4 font-medium">Priority</th>
              <th scope="col" className="px-4 font-medium">Due</th>
              <th scope="col" className="px-4 font-medium">Created</th>
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
