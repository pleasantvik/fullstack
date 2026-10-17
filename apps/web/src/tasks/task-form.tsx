import type { FormEventHandler } from "react";
import type { FieldErrors, UseFormRegisterReturn } from "react-hook-form";
import { Field, inputClass } from "../components/field";
import { PRIORITY_LABEL, STATUS_LABEL } from "./task-format";
import type { TaskFields } from "./use-create-task";

// Markup only. Create (5a) and edit (5b) pass in their own hook's output.
export function TaskForm({
  fields,
  errors,
  onSubmit,
  isPending,
  formError,
  submitLabel,
  onCancel,
}: {
  fields: Record<keyof TaskFields, UseFormRegisterReturn>;
  errors: FieldErrors<TaskFields>;
  onSubmit: FormEventHandler<HTMLFormElement>;
  isPending: boolean;
  formError: string | null;
  submitLabel: string;
  onCancel: () => void;
}) {
  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {/* autoFocus: showModal() moves focus to it, so typing starts at once. */}
      <Field label="Title" error={errors.title?.message}>
        <input {...fields.title} autoFocus className={inputClass} />
      </Field>

      <Field label="Description" error={errors.description?.message}>
        <textarea {...fields.description} rows={3} className={inputClass} />
      </Field>

      <div className="grid grid-cols-3 gap-3">
        <Field label="Status">
          <select {...fields.status} className={inputClass}>
            {Object.entries(STATUS_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Priority">
          <select {...fields.priority} className={inputClass}>
            {Object.entries(PRIORITY_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>

        {/* Its value is already YYYY-MM-DD - exactly what the API and the
            overdue check expect. */}
        <Field label="Due">
          <input type="date" {...fields.dueDate} className={inputClass} />
        </Field>
      </div>

      {formError && (
        <p role="alert" className="text-sm text-danger">
          {formError}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-border px-4 py-2 text-sm"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {isPending ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
