export function ServerUnreachable({ onRetry }: { onRetry: () => void }) {
  return (
    <main className="mx-auto max-w-md p-8">
      <h1 className="text-xl font-medium">Can't reach the server</h1>
      <p className="mt-2 text-sm text-text-muted">
        This isn't a sign-in problem - the app couldn't get an answer. Check your
        connection and try again.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-6 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white"
      >
        Try again
      </button>
    </main>
  );
}
