import { DeleteTask } from "./delete-task";
import { TaskForm } from "./task-form";
import { useEditTask } from "./use-edit-task";
import type { Task } from "./use-tasks";

// Mounted only once the task is loaded: useForm reads its defaultValues once.
export function EditTaskForm({ task, onDone }: { task: Task; onDone: () => void }) {
  const edit = useEditTask(task, { onSaved: onDone });
  return (
    <>
      <TaskForm {...edit} submitLabel="Save" onCancel={onDone} />
      <DeleteTask id={task.id} onDeleted={onDone} />
    </>
  );
}
