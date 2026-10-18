import { useRef, useState } from "react";
import { useDeleteTask } from "./use-delete-task";

// Two steps, and the second is a different button. Relabelling one button
// ("Delete" -> "Confirm delete") leaves focus on it, so pressing Enter twice
// deletes - the confirmation protects nothing for a keyboard user.
// Not window.confirm(): it blocks the main thread until answered, cannot be
// styled, and can be silently suppressed by the browser.
export function DeleteTask({ id, onDeleted }: { id: string; onDeleted: () => void }) {
  const { deleteTask, isPending, error } = useDeleteTask(id, { onDeleted });
  const [confirming, setConfirming] = useState(false);
  const deleteButton = useRef<HTMLButtonElement>(null);

  function cancel() {
    setConfirming(false);
    // The focused Cancel button is about to leave the DOM; without this, focus
    // falls to <body>. requestAnimationFrame waits for the re-render.
    requestAnimationFrame(() => deleteButton.current?.focus());
  }

  return (
    <div className="mt-6 border-t border-border pt-4 text-sm">
      {confirming ? (
        <div className="flex items-center gap-2">
          <span className="mr-auto">Delete this task? This can't be undone.</span>
          {/* autoFocus on the safe choice: focus must land somewhere when the
              Delete button it replaced disappears, and here Enter cancels. */}
          <button
            type="button"
            autoFocus
            onClick={cancel}
            className="rounded-lg border border-border px-3 py-1.5"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={deleteTask}
            disabled={isPending}
            className="rounded-lg bg-danger px-3 py-1.5 font-medium text-white disabled:opacity-60"
          >
            {isPending ? "Deleting..." : "Delete"}
          </button>
        </div>
      ) : (
        <button
          ref={deleteButton}
          type="button"
          onClick={() => setConfirming(true)}
          className="text-danger hover:underline"
        >
          Delete task
        </button>
      )}

      {error && (
        <p role="alert" className="mt-2 text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
