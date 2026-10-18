import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { api } from "../lib/api";
import { describeError } from "../lib/describe-error";
import { EMPTY_TASK, FIELD_RULES, type TaskFields } from "./task-fields";
import { type Task, taskKeys } from "./use-tasks";

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
  const form = useForm<TaskFields>({ mode: "onBlur", defaultValues: EMPTY_TASK });

  const mutation = useMutation({
    mutationFn: (values: TaskFields) => api.post<Task>("/tasks", toBody(values)),
    onSuccess: async () => {
      // Lists only: a task that did not exist cannot have a detail query.
      // Awaited, so the new task is already in the list when the modal closes.
      await queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      onCreated();
    },
  });

  return {
    fields: {
      title: form.register("title", FIELD_RULES.title),
      description: form.register("description", FIELD_RULES.description),
      status: form.register("status"),
      priority: form.register("priority"),
      dueDate: form.register("dueDate"),
    },
    errors: form.formState.errors,
    onSubmit: form.handleSubmit((values) => mutation.mutate(values)),
    isPending: mutation.isPending,
    formError: mutation.error ? describeError(mutation.error) : null,
  };
}
