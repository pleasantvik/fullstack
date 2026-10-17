// The live region is always in the DOM, even when empty: screen readers
// announce changes inside an existing region, and often miss one that arrives
// already containing text.
//
// No auto-dismiss. An error that vanishes after a few seconds can be gone
// before a slow reader, or a screen reader, reaches it (WCAG 2.2.1).
export function Toast({
  message,
  onDismiss,
}: {
  message: string | null;
  onDismiss: () => void;
}) {
  return (
    <div aria-live="assertive" className="fixed right-6 bottom-6 z-50 max-w-sm">
      {message && (
        <div className="flex items-start gap-3 rounded-lg border border-danger bg-surface p-3 text-sm shadow-lg">
          <p className="text-danger">{message}</p>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss"
            className="ml-auto text-text-muted"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
