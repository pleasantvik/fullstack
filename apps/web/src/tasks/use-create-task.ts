import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { api } from "../lib/api";
import { describeError } from "../lib/describe-error";
import { TASKS_KEY, type Task, type TaskPriority, type TaskStatus } from "./use-tasks";

// What the form holds: every field a string, as inputs give them.
export interface TaskFields {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
}

// Empty optional fields are left out rather than sent as "": an empty
// description would be stored as "" instead of null, and "no description"
// would then have two shapes in the database. dueDate is already YYYY-MM-DD
// from the date input - never passed through new Date() here, which would make
// it a local-time instant.
function toBody({ title, description, status, priority, dueDate }: TaskFields) {
  return {
    title: title.trim(),
    status,
    priority,
    ...(description.trim() && { description: description.trim() }),
    ...(dueDate && { dueDate }),
  };
}

// Not optimistic: a new task has no id until the server answers, and swapping
// a temporary id for the real one changes its React key. Creating is rare, and
// the user is sitting in a form; "Saving..." for a few hundred ms is honest.
export function useCreateTask({ onCreated }: { onCreated: () => void }) {
  const queryClient = useQueryClient();

  const form = useForm<TaskFields>({
    mode: "onBlur",
    defaultValues: { title: "", description: "", status: "TODO", priority: "MEDIUM", dueDate: "" },
  });

  const mutation = useMutation({
    mutationFn: (values: TaskFields) => api.post<Task>("/tasks", toBody(values)),
    onSuccess: async () => {
      // Awaited, so the new task is already in the list when the modal closes.
      await queryClient.invalidateQueries({ queryKey: TASKS_KEY });
      onCreated();
    },
  });

  // Mirrors CreateTaskDto. The trim check catches a title of only spaces,
  // which @IsNotEmpty on the server would accept.
  const fields = {
    title: form.register("title", {
      required: "Give the task a title.",
      validate: (value) => value.trim() !== "" || "Give the task a title.",
      maxLength: { value: 200, message: "Keep the title under 200 characters." },
    }),
    description: form.register("description", {
      maxLength: { value: 2000, message: "Keep the description under 2,000 characters." },
    }),
    status: form.register("status"),
    priority: form.register("priority"),
    dueDate: form.register("dueDate"),
  };

  return {
    fields,
    errors: form.formState.errors,
    onSubmit: form.handleSubmit((values) => mutation.mutate(values)),
    isPending: mutation.isPending,
    formError: mutation.error ? describeError(mutation.error) : null,
  };
}
