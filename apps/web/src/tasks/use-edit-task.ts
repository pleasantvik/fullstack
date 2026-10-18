import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { api } from "../lib/api";
import { describeError } from "../lib/describe-error";
import { FIELD_RULES, type TaskFields, toFields } from "./task-fields";
import { type Task, taskKeys } from "./use-tasks";

// Only the fields the user changed. Sending every field would overwrite a
// change made elsewhere (another tab) between opening the form and saving it -
// a lost update. This narrows the window to fields both sides edited; closing
// it fully needs a version check on the server (If-Match / a version column).
//
// Changed is decided by comparing with the starting values, not by
// react-hook-form's dirtyFields: formState is a Proxy that only tracks
// dirtyFields when read during render, and an unsubscribed read can come back
// empty - every save would then send nothing.
//
// A cleared optional field is sent as null: leaving it out would mean "no
// change", and the old value would survive.
function toPatch(values: TaskFields, initial: TaskFields) {
  const patch: Record<string, string | null> = {};
  if (values.title.trim() !== initial.title) patch.title = values.title.trim();
  if (values.description.trim() !== initial.description)
    patch.description = values.description.trim() || null;
  if (values.status !== initial.status) patch.status = values.status;
  if (values.priority !== initial.priority) patch.priority = values.priority;
  if (values.dueDate !== initial.dueDate) patch.dueDate = values.dueDate || null;
  return patch;
}

// Not optimistic, for the same reason as create: the user is in a form, and
// "Saving..." is honest.
export function useEditTask(task: Task, { onSaved }: { onSaved: () => void }) {
  const queryClient = useQueryClient();

  // Frozen at mount, like defaultValues. If this followed `task`, a background
  // refetch carrying another tab's change would make the untouched field look
  // edited, and the old value would be sent back over the new one.
  const [initial] = useState(() => toFields(task));
  const form = useForm<TaskFields>({ mode: "onBlur", defaultValues: initial });

  const mutation = useMutation({
    mutationFn: (patch: Record<string, string | null>) =>
      api.patch<Task>(`/tasks/${task.id}`, patch),
    onSuccess: async (updated) => {
      // The PATCH answers with the saved task, so the detail needs no refetch.
      queryClient.setQueryData(taskKeys.detail(task.id), updated);
      await queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      onSaved();
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
    onSubmit: form.handleSubmit((values) => {
      const patch = toPatch(values, initial);
      // Nothing changed: no request, just close.
      if (Object.keys(patch).length === 0) onSaved();
      else mutation.mutate(patch);
    }),
    isPending: mutation.isPending,
    formError: mutation.error ? describeError(mutation.error) : null,
  };
}
