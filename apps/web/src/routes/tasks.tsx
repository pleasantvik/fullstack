import { useLogout } from "../auth/use-logout";
import { useMe } from "../auth/use-me";
import { Modal } from "../components/modal";
import { TaskBoard } from "../tasks/task-board";
import { TaskForm } from "../tasks/task-form";
import { TaskTable } from "../tasks/task-table";
import { useCreateTask } from "../tasks/use-create-task";
import { useTaskModal } from "../tasks/use-task-modal";
import { type TaskView, useTaskView } from "../tasks/use-task-view";

// Same geometry as BoardSkeleton in require-auth.tsx - a 56px bar, then p-6 - so
// the skeleton gives way to the page without anything jumping. Change one,
// change both.
export function TasksPage() {
  const { data: user } = useMe();
  const { logout, isPending, error } = useLogout();
  const { view, setView } = useTaskView();
  const { task, openNew, close } = useTaskModal();

  return (
    <div className="min-h-screen">
      <header className="flex h-14 items-center gap-6 border-b border-border bg-surface px-6">
        <h1 className="text-base font-medium">Tasks</h1>
        <ViewToggle view={view} onChange={setView} />

        <div className="ml-auto flex items-center gap-3 text-sm">
          <button
            type="button"
            onClick={openNew}
            className="rounded-lg bg-accent px-3 py-1.5 font-medium text-white"
          >
            New task
          </button>
          {/* The guard guarantees a user; TypeScript can't know that. */}
          <span className="text-text-muted">{user?.name ?? user?.email}</span>
          <button
            type="button"
            onClick={logout}
            disabled={isPending}
            className="rounded-lg border border-border px-3 py-1.5 disabled:opacity-60"
          >
            {isPending ? "Logging out..." : "Log out"}
          </button>
        </div>
      </header>

      {error && (
        <p role="alert" className="px-6 pt-4 text-sm text-danger">
          {error}
        </p>
      )}

      <main className="p-6">
        {view === "table" ? <TaskTable /> : <TaskBoard />}
      </main>

      <Modal open={task === "new"} onClose={close} title="New task">
        <CreateTask onDone={close} />
      </Modal>
    </div>
  );
}

// Its own component so useCreateTask lives inside the modal's children: it
// unmounts on close, and the next open starts with an empty form.
function CreateTask({ onDone }: { onDone: () => void }) {
  const create = useCreateTask({ onCreated: onDone });
  return <TaskForm {...create} submitLabel="Create task" onCancel={onDone} />;
}

const VIEWS: { value: TaskView; label: string }[] = [
  { value: "board", label: "Board" },
  { value: "table", label: "Table" },
];

function ViewToggle({
  view,
  onChange,
}: {
  view: TaskView;
  onChange: (view: TaskView) => void;
}) {
  return (
    // role="group" plus aria-pressed: a screen reader hears "Board, toggle
    // button, pressed" rather than two unrelated buttons.
    <div
      role="group"
      aria-label="View"
      className="flex rounded-lg bg-surface-muted p-0.5 text-sm"
    >
      {VIEWS.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          aria-pressed={view === value}
          onClick={() => onChange(value)}
          className={
            view === value
              ? "rounded-md bg-surface px-3 py-1 font-medium shadow-sm"
              : "rounded-md px-3 py-1 text-text-muted"
          }
        >
          {label}
        </button>
      ))}
    </div>
  );
}
