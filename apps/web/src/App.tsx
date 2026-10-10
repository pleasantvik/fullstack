import { useEffect, useState } from "react";

type ApiStatus = "checking" | "ok" | "unreachable";

// Throwaway. Fetching in useEffect is exactly what TanStack Query replaces in
// 1.6c - this one exists to show the problems it solves, not to be kept.
export function App() {
  const [status, setStatus] = useState<ApiStatus>("checking");

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/health`)
      .then((res) => setStatus(res.ok ? "ok" : "unreachable"))
      .catch(() => setStatus("unreachable"));
  }, []);

  return (
    <main className="mx-auto max-w-xl p-8">
      <h1 className="text-xl font-medium">Task Manager</h1>
      <p className="mt-1 text-sm text-text-muted">API: {status}</p>

      <section className="mt-6 rounded-xl border border-border bg-surface p-4">
        <h2 className="text-label font-medium text-text-muted">Tokens</h2>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="rounded-lg bg-accent/10 px-2 py-1 text-accent">accent</span>
          <span className="rounded-lg bg-danger/10 px-2 py-1 text-danger">danger</span>
          <span className="rounded-lg bg-warning/10 px-2 py-1 text-warning">warning</span>
          <span className="rounded-lg bg-success/10 px-2 py-1 text-success">success</span>
        </div>
      </section>
    </main>
  );
}
