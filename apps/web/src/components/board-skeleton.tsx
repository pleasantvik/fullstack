// Shaped like the page it stands in for: the 56px top bar and three equal
// columns from ui-spec.md, matching routes/tasks.tsx - change one, change both.
// Not for CLS: a removed skeleton and a newly added page are not a "shift", so
// CLS scores 0 either way (measured in 1.6f). The matching geometry prevents
// the visible jump that no metric catches.
export function BoardSkeleton() {
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
