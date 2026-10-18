// A failed load with a way to try again. Presentational: the caller decides
// the message and what retrying means.
export function LoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="text-sm">
      <p className="text-danger">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-2 rounded-lg border border-border px-3 py-1.5"
      >
        Try again
      </button>
    </div>
  );
}
