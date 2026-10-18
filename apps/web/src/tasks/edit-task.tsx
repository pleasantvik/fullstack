import { EditTaskForm } from "./edit-task-form";
import { useTaskDetail } from "./use-task-detail";

export function EditTask({ id, onDone }: { id: string; onDone: () => void }) {
  const { task, isPending, error } = useTaskDetail(id);

  // Usually skipped: seeded from the list, the query starts with data.
  if (isPending) return <p className="text-sm text-text-muted">Loading task...</p>;

  if (error || !task) {
    return (
      <p role="alert" className="text-sm text-danger">
        {error}
      </p>
    );
  }

  // Keyed by id, so moving straight from one task to another remounts the form
  // with the new task's values rather than keeping the old ones.
  return <EditTaskForm key={task.id} task={task} onDone={onDone} />;
}
