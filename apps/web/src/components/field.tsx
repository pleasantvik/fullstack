import type { ReactNode } from "react";

export const inputClass = "rounded-lg border border-border bg-surface px-3 py-2";

// The label wraps its input, which associates the two without an id: clicking
// the label focuses the field, and a screen reader announces it with the input.
export function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      {label}
      {children}
      {error && (
        <span role="alert" className="text-xs text-danger">
          {error}
        </span>
      )}
    </label>
  );
}
