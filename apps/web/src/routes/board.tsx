import { useLogout } from "../auth/use-logout";
import { useMe } from "../auth/use-me";

// Placeholder until 1.6g. The guard guarantees a user here; TypeScript can't
// know that, hence the optional chaining.
export function BoardPage() {
  const { data: user } = useMe();
  const { logout, isPending, error } = useLogout();

  return (
    <main className="mx-auto max-w-xl p-8">
      <h1 className="text-xl font-medium">Board</h1>
      <p className="mt-1 text-sm text-text-muted">
        Logged in as {user?.name ?? user?.email}
      </p>

      <button
        type="button"
        onClick={logout}
        disabled={isPending}
        className="mt-6 rounded-lg border border-border px-4 py-2 text-sm disabled:opacity-60"
      >
        {isPending ? "Logging out..." : "Log out"}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}
    </main>
  );
}
