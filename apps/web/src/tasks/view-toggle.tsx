import type { TaskView } from "./use-task-view";

const VIEWS: { value: TaskView; label: string }[] = [
  { value: "board", label: "Board" },
  { value: "table", label: "Table" },
];

export function ViewToggle({
  view,
  onChange,
}: {
  view: TaskView;
  onChange: (view: TaskView) => void;
}) {
  return (
    // role="group" plus aria-pressed: a screen reader hears "Board, toggle
    // button, pressed" rather than two unrelated buttons.
    <div role="group" aria-label="View" className="flex rounded-lg bg-surface-muted p-0.5 text-sm">
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
