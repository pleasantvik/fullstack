import { TaskForm } from "./task-form";
import { useCreateTask } from "./use-create-task";

// Rendered inside the modal's children, so the form state unmounts on close
// and the next open starts empty.
export function CreateTask({ onDone }: { onDone: () => void }) {
  const create = useCreateTask({ onCreated: onDone });
  return <TaskForm {...create} submitLabel="Create task" onCancel={onDone} />;
}
