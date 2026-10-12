import { Navigate, Outlet, useLocation } from "react-router";
import { useMe } from "./use-me";

// The order of these checks is the whole design: nothing redirects until there
// is an answer to redirect on.
export function RequireAuth() {
  const me = useMe();
  const location = useLocation();

  if (me.isPending) {
    return <BoardSkeleton />;
  }

  if (me.isError) {
    return <ServerUnreachable onRetry={() => void me.refetch()} />;
  }

  if (me.data === null) {
    // `replace` keeps this URL out of history, so Back from the login page
    // doesn't bounce straight back here. `from` returns the user to where they
    // were once they've logged in.
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

// Shaped like the board it stands in for: the 56px top bar and three equal
// columns from ui-spec.md. When the real board replaces it, nothing moves - a
// CLS control, not decoration. The board in 1.6g must keep this geometry, or
// the skeleton stops doing its job.
function BoardSkeleton() {
  return (
    <div aria-busy="true" className="min-h-screen">
      <span className="sr-only">Loading</span>
      <div className="h-14 border-b border-border bg-surface" />
      <div className="grid grid-cols-3 gap-3 p-6">
        {[0, 1, 2].map((i) => (
          // animate-pulse changes opacity only, which the compositor can do
          // without re-running layout or paint.
          <div key={i} className="h-96 animate-pulse rounded-xl bg-surface-muted" />
        ))}
      </div>
    </div>
  );
}

function ServerUnreachable({ onRetry }: { onRetry: () => void }) {
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
