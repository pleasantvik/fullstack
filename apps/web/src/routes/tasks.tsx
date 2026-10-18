import { useLogout } from "../auth/use-logout";
import { useMe } from "../auth/use-me";
import { Modal } from "../components/modal";
import { CreateTask } from "../tasks/create-task";
import { EditTask } from "../tasks/edit-task";
import { TaskBoard } from "../tasks/task-board";
import { TaskTable } from "../tasks/task-table";
import { useTaskModal } from "../tasks/use-task-modal";
import { useTaskView } from "../tasks/use-task-view";
import { ViewToggle } from "../tasks/view-toggle";

// Same geometry as components/board-skeleton.tsx - a 56px bar, then p-6 - so
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

      <main className="p-6">{view === "table" ? <TaskTable /> : <TaskBoard />}</main>

      <Modal open={task !== null} onClose={close} title={task === "new" ? "New task" : "Edit task"}>
        {task === "new" ? <CreateTask onDone={close} /> : task && <EditTask id={task} onDone={close} />}
      </Modal>
    </div>
  );
}
