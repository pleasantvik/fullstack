# Interview notes

Concepts learned while building this project, written as questions an
interviewer might ask. Each answer has the general explanation, then **In this
project** - what I built or measured, which is what makes an answer credible.

Measurement setup unless stated otherwise: production build (`vite build` +
`vite preview`), InPrivate window (no extensions), cache disabled, CPU 4x
slowdown, Fast 4G, middle value of three runs.

---

## 1. Core Web Vitals

### What are the Core Web Vitals, and how is a site judged on them?

Three metrics: **LCP** (loading), **CLS** (visual stability), **INP**
(responsiveness). Google judges them on **field data** - real users' browsers,
collected in the Chrome UX Report - at the **75th percentile**: a page passes
if 3 in 4 visits are within the "good" threshold.

| Metric | Good | Poor |
|---|---|---|
| LCP | ≤ 2.5 s | > 4 s |
| CLS | ≤ 0.1 | > 0.25 |
| INP | ≤ 200 ms | > 500 ms |

**Lab data** (DevTools, Lighthouse) is one run on one machine under chosen
conditions. It is for diagnosing, not for knowing what users experience.

### What is LCP, and what counts as the "largest" element?

Largest Contentful Paint: when the largest image or text block **in the
viewport** finished rendering, measured from navigation start. Candidates are
`<img>`, `<image>` in SVG, video posters, CSS background images, and
block-level elements containing text. Elements outside the viewport do not
count. The browser stops updating LCP after the first user input (click, key,
scroll).

LCP splits into four subparts: **time to first byte**, **resource load delay**,
**resource load duration**, **element render delay**. A text LCP element has no
resource to load, so after TTFB its whole delay is render delay - waiting for
JavaScript, data and fonts.

**In this project:**
- With a 12 ms TTFB, render delay was 1,280-3,062 ms: the chain HTML → JS →
  React starts → `/auth/me` → `/tasks` → paint. Every step waits for the last.
- The LCP element was the "Logged in as Pooh Gator" line, not the table.
  Each table cell was smaller than that one line, so the table never became the
  LCP element, and `/tasks` did not affect LCP at all.
- **A good LCP does not mean useful content has arrived.** Parallelising
  `/auth/me` and `/tasks` would show the table ~200 ms sooner and not move LCP.
- The LCP element depends on the user: a shorter name makes that line smaller
  and a different element wins. One reason lab and field disagree.
- After moving the name into a small top-bar `<span>`, the table view's LCP
  element became a title cell (`td.truncate`) and now does wait for `/tasks`.
- Rule: **find the LCP element before optimising anything.** My first
  prediction of what it was turned out wrong.

### What is CLS, and what does it not catch?

Cumulative Layout Shift scores **visible elements that change position between
two frames** - the same element, moved. Score per shift = impact fraction
(how much of the viewport the moving element covers) × distance fraction (how
far it moved). Shifts are grouped into session windows (shifts less than 1 s
apart, window at most 5 s); CLS is the worst window.

**Elements that appear or disappear do not count** - they have no "before" or
"after" position. Shifts within 500 ms of user input do not count either.

**In this project:**
- CLS was 0.00 with a plain "Loading tasks..." line: it is *replaced* by the
  table (new content, not moved content). Only the logout button moved, scoring
  ~0.003. A skeleton would have fixed nothing, so that experiment was dropped.
- Blind spot: if the auth skeleton's bar were 64 px and the real bar 56 px, the
  user would see everything jump 8 px - and CLS would be 0, because the
  skeleton is removed and the page is new. A clean metric is not a clean screen.
- Font swap caused no CLS because every Tailwind text utility sets a
  `line-height` and the table is `table-fixed` with fixed row heights: a new
  font can change widths but never heights.

```css
/* Text can't change height when a font swaps, because the line box is fixed: */
.text-xl { font-size: 1.25rem; line-height: 1.75rem; }  /* Tailwind's text-xl */
```
```html
<!-- Columns sized from the colgroup, never from content: -->
<table class="table-fixed">
  <colgroup><col /><col class="w-[132px]" /><col class="w-[110px]" /></colgroup>
</table>
```

### What is INP, and why did it replace FID?

Interaction to Next Paint (a Core Web Vital since March 2024): for each click,
tap or key press, the time until the browser **next paints**. The page's INP is
roughly its worst interaction (for pages with many interactions, about the
98th percentile). Three parts: **input delay** (waiting for the main thread),
**processing duration** (event handlers), **presentation delay** (render,
layout, paint).

FID (First Input Delay) measured only the input delay of the *first*
interaction, so a page with slow handlers or a slow 20th click looked fine.

**INP is not "time until the result appears".** It ends at the next paint,
whatever that paint contains.

**In this project:**
- Naive done-checkbox: INP **56 ms** ("good") while the tick took **~450 ms** to
  appear - PATCH then refetch, with an idle main thread.
- Optimistic version: INP **16-24 ms** (input delay 1, processing 5,
  presentation 18) and click-to-tick **under 50 ms**. The optimistic update
  fixed perceived latency; INP was never the problem.

### What is TBT, and how does Lighthouse relate to the Core Web Vitals?

Total Blocking Time: for every long task between FCP and Time to Interactive,
the part beyond 50 ms, summed. Lighthouse cannot click, so it cannot measure
INP; TBT is its lab stand-in for main-thread congestion during load.

Lighthouse uses **simulated throttling** (a slower network than Fast 4G plus 4x
CPU, modelled rather than replayed), so its numbers are harsher than a DevTools
trace. Compare Lighthouse with Lighthouse, traces with traces. The performance
score weights TBT 30%, LCP 25%, CLS 25%, FCP 10%, Speed Index 10% - fix the
metrics and the score follows.

**In this project:** Lighthouse on the board gave LCP 3.5 s where traces gave
~1.2 s, and **TBT 1,690 ms** - the same long tasks the console reported as
`[Violation] 'setTimeout' handler took 766ms`.

### What is a long task?

Any task that occupies the main thread for **more than 50 ms**. While it runs,
the page cannot respond to input; a click waits (input delay). DevTools marks
them with a red-striped corner.

**In this project:** a 1.4 s long task after a checkbox click made a second
click wait - but only on the **dev server** with React DevTools installed. In
production the same re-render took 5 ms.

---

## 2. Measuring performance properly

### Why should you never profile the dev server?

Development builds are a different program: React's development build (extra
checks and warnings), StrictMode double-invoking effects, and Vite serving
every module unbundled, so the browser discovers imports one level at a time.

**In this project:**

| | Dev server | Production build |
|---|---|---|
| Requests | 40 | 5 |
| Transferred | 7.0 MB | ~155 kB |
| Import chain | 8 levels | 4 levels |
| LCP | ~9 s | ~1.7 s |

`react-dom` alone was 3.1 MB in development. Three separate times a dev trace
suggested a problem that production did not have.

### How do you get trustworthy lab numbers?

- Production build, served like production.
- InPrivate/incognito: extensions inject scripts and show up in traces
  (React DevTools alone used 667 ms of main thread in one trace).
- Disable cache, so every run is a first visit. A warm run of the same page
  was 3 s vs 9 s cold - mixing them makes comparisons meaningless.
- CPU and network throttling: your laptop is not the 75th-percentile phone.
- Several runs, take the **median**, not the mean - one bad run (5.03 s among
  ~2 s runs) drags a mean but not a median.
- Discard runs with unrelated work (an expired token causing a refresh).
- **One change at a time**, baseline → change → re-measure.
- A difference smaller than the run-to-run spread is not a measured difference.

### How do you read a Performance trace?

- **Network track:** horizontal position is time; a request that starts where
  another ends was waiting for it. The Network panel's **Initiator** column
  shows *who* requested each file - follow it to see the chain.
- **Main track:** a flame chart. Yellow = scripting, purple = rendering
  (style, layout), green = painting, grey = system.
- **Self vs total time:** "Evaluate module 312 ms (self 0.67 ms)" means almost
  all the time is in what it called - look one level down.
- **Markers:** Nav, DCL, FCP, LCP. Hover LCP to highlight the element.
- **Screenshots strip:** what the user actually saw, frame by frame.

```js
// Measuring a single function quickly, in the Console or temporarily in code:
console.time("group");
const groups = groupByStatus(tasks.data.items);
console.timeEnd("group"); // group: 0.124 ms
```

### Do bytes or round trips matter more?

On mobile networks, usually round trips. **In this project:** a 571-byte
`/auth/me` took 274 ms; a 24 kB font took 195 ms. What decides a resource's
cost is when its request *starts* and how many requests it waits behind.

### Should you act on every DevTools insight?

No - check it against what the metric is actually waiting for. "Render-blocking
requests: save 104 ms" was true for first paint, but LCP was waiting a second
longer for data, so fixing it would not have moved LCP. "Font display: save
300 ms" referred to a heading that was not the LCP element.

---

## 3. Loading, build and fonts

### What does a production build do?

**Bundling** (165 modules → 1 file, collapsing the import chain), production
React (development checks removed), **minification** (shorter names, no
whitespace), and **content hashing** (`index-BBzBpZou.js`) so files can be
cached forever - a changed file gets a new name. Compression (**gzip** or
Brotli) is applied by the server: 390 kB → 123 kB on the wire.

**In this project:** files referenced from `src/` get hashed names; files in
`public/` are copied as-is and cannot safely be cached forever.

### What is code splitting, and when is it worth it?

Loading a route's code only when the route is visited (`React.lazy`, dynamic
`import()`). **In this project:** the board page downloads `login.tsx`,
`register.tsx` and react-hook-form (409 kB unminified) it never uses - a
candidate, not yet done, because it was not the bottleneck measured.

```tsx
// Route-level splitting (not done in this project yet):
const RegisterPage = lazy(() => import("./routes/register"));
// <Suspense fallback={<Spinner />}><RegisterPage /></Suspense>
// The register page's code (and react-hook-form) downloads only when visited.
```

### How does `font-display` affect LCP and CLS?

| Value | Block period | Swap period | Effect |
|---|---|---|---|
| `block` | ~3 s | infinite | Invisible text (FOIT); delays text LCP |
| `swap` | ~0 | infinite | Fallback first (FOUT); may cause CLS |
| `fallback` | ~100 ms | ~3 s | Compromise |
| `optional` | ~100 ms | none | No CLS, no delay; font may only appear on the next visit |

A browser requests a font only when rendered text needs it.

**In this project:** Inter `block` 2.00 s, `swap` 1.44 s, system font ~1.7 s -
all within noise. `block` only came out even by accident: the hidden
`sr-only` "Loading" text in the auth skeleton requested weight 400 early, and
the LCP element used 400. **Chose `swap`**, because it does not depend on that
accident.

```css
@font-face {
  font-family: "Inter";
  font-weight: 400;
  font-display: swap; /* text is never hidden while the font loads */
  src: url("./assets/fonts/inter-latin-400.woff2") format("woff2"); /* in src/: hashed by Vite */
}
@theme { --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif; } /* fallbacks */
```

### Why self-host fonts instead of Google Fonts?

Google Fonts needs two extra origins (CSS from `fonts.googleapis.com`, files
from `fonts.gstatic.com`), each with DNS + TCP + TLS before a byte arrives, and
sends every visitor's IP address to Google (a Munich court fined a site for this
under GDPR in 2022). Self-hosted: same origin, hashed, cached forever.

**In this project:** two Latin WOFF2 files, weights 400 and 500 only (the
design uses two), 24 kB each - instead of a 4.1 MB, 420-file package. WOFF2 is
already compressed, so gzip adds nothing. Cost of vendoring: nobody updates the
files for you.

---

## 4. React

### Why do list items need keys, and why not the index?

React matches old and new children by key during **reconciliation**. Same key
→ same component instance and DOM node, reused with new props.

With `key={index}`, prepending an item gives every row a different item: React
updates every row's DOM, and **row state (a ticked checkbox, focus, typed
text, an animation) stays at the position** - attached to the wrong item. The
**text still looks right**, because text comes from props on every render; the
key decides only which instance (and its state) is reused.

**In this project:** the list is newest-first, so every new task lands at
index 0 - the worst case for index keys. Rows and board cards use `task.id`;
a task that changes status moves between board columns as itself.

```tsx
// ✗ state (a ticked box, focus) stays with the position, not the task
{items.map((task, i) => <TaskRow key={i} task={task} />)}

// ✓ state follows the task, even when a new one is added at the top
{items.map((task) => <TaskRow key={task.id} task={task} />)}
```

### What is derived state, and why not copy server data into `useState`?

Anything computable from existing data should be computed during render, not
stored. Copying into `useState` and syncing with `useEffect` creates **two
sources of truth**: the copy is a render behind (render, effect, render again),
and every other writer (a refetch, an optimistic update) must update both.

A related trap: `useState(initial)` reads its initial value **once**, on mount.
`useState(params.get("view"))` ignores later URL changes on the same route, so
screen and address bar disagree.

**In this project:** the board groups tasks by status on every render.

```tsx
// ✗ a copy: one render behind, and every writer must update both
const [groups, setGroups] = useState({});
useEffect(() => setGroups(groupByStatus(items)), [items]);

// ✓ derived: computed from the single source on every render
const groups = groupByStatus(items);

// ✗ reads the URL once; a later ?view= change on the same route is ignored
const [view, setView] = useState(params.get("view"));
// ✓ read on every render
const view = params.get("view") === "table" ? "table" : "board";
```

### When should you use `useMemo` or `React.memo`?

When a measurement shows a cost worth saving. Both have their own cost: more
code, comparisons on every render, dependency lists that can be wrong, and (for
`memo`) props that must stay referentially stable (`useCallback`).

**In this project:**
- `groupByStatus` over 100 tasks: **0.124 ms** first run, 0.026 ms second (JIT
  warm-up). A frame is 16.7 ms → no `useMemo`.
- Re-rendering 100 table rows after a tick: **5 ms** processing in production
  → no `React.memo`. The dev trace showed 1.4 s and would have suggested the
  opposite.
- The real cost in production is **mount** (creating 100 rows of DOM and laying
  them out, 300-700 ms at 4x CPU on first load), not **update**.

```tsx
// Only after measuring a real cost. React.memo also needs stable props:
const TaskRow = memo(function TaskRow({ task, onSetDone }) { /* ... */ });
const setDone = useCallback((id, done) => mutate({ id, done }), [mutate]);
// Without useCallback, a new function every render defeats memo entirely.
```

### Controlled vs uncontrolled inputs?

Controlled: React state/props decide the value (`checked={...}`); a click asks,
the data answers. Uncontrolled: the DOM keeps its own value
(`defaultChecked`). Swapping a slow controlled checkbox for `defaultChecked`
*looks* instant, but the box then holds its own state - a failed save leaves it
ticked and nothing ever corrects it.

```tsx
// ✓ controlled: the data decides; a failed save leaves it correct
<input type="checkbox" checked={task.status === "DONE"} onChange={...} />

// ✗ uncontrolled: looks instant, but holds its own state - a failed save
//   leaves it ticked and nothing ever corrects it
<input type="checkbox" defaultChecked={task.status === "DONE"} onChange={...} />
```

### Why do effects run twice in development?

React StrictMode mounts, unmounts and remounts components in development to
expose effects that do not clean up. It does not happen in production. It also
means anything timed in dev runs twice - the second run is faster because the
JavaScript engine has optimised the function.

### How do you reset a component's state, e.g. a form, when its input changes?

Change its `key`. React treats a different key as a different component:
unmount, mount, fresh state. Needed because many things read their input
**once at mount**: `useState(initial)`, react-hook-form's `defaultValues`.

**In this project:** the edit form is keyed by task id and only mounts once the
task has loaded; a background refetch never overwrites what the user is typing
because `defaultValues` are not re-read.

```tsx
// A different key = unmount + mount = fresh useForm({ defaultValues })
<EditTaskForm key={task.id} task={task} onDone={close} />
```

### Why `useState(() => compute())` instead of `const x = compute()`?

The initialiser runs on the first render only; a plain expression runs on
every render. **In this project:** the edit form's starting values are frozen
with it. Recomputed each render, they would follow a background refetch, an
untouched field would look edited, and the old value would be sent back over
another tab's change.

```tsx
const initial = toFields(task);               // ✗ recomputed every render
const [initial] = useState(() => toFields(task)); // ✓ frozen at mount
```

### What is react-hook-form's Proxy subscription, and what is its trap?

`formState` is a `Proxy`: a component re-renders only for the properties it
**reads during render** (a re-render optimisation). The trap: a property read
only inside an event handler (`dirtyFields`) may never be tracked and come back
empty. **In this project:** "changed fields" is computed by comparing values
with the frozen starting values instead.

```tsx
const form = useForm({ defaultValues });
const { errors } = form.formState;  // read during render → subscribed

onSubmit = form.handleSubmit((values) => {
  form.formState.dirtyFields;      // ✗ read only here: may be empty
  toPatch(values, initial);        // ✓ compare with frozen starting values
});
```

---

## 5. Server state with TanStack Query

### Server state vs client state?

Server state is owned by the server, shared, and can change without you (tasks,
the current user). Client state exists only in this browser (which view is
selected, whether a modal is open). They need different tools: server state
needs caching, deduplication, refetching and invalidation; client state needs
a place to live.

### What is a query key, and what must it contain?

The cache address of a query's result. It must contain **every input the query
function uses** - otherwise two different requests share one cache entry and
one component is handed another's data. Keys match by prefix:
`invalidateQueries({ queryKey: ["tasks"] })` covers `["tasks", { limit: 100 }]`
and any future filtered list.

**In this project:** the API defaults to 20 items per page; a key without the
limit (and a URL without `?limit=100`) would silently drop the 21st task.

```ts
// ✗ the limit isn't in the key; the API's default of 20 applies silently
useQuery({ queryKey: ["tasks"], queryFn: () => api.get("/tasks") });

// ✓ every input of the query function is in the key, and builds the URL
const params = { limit: 100 };
useQuery({
  queryKey: ["tasks", "list", params],
  queryFn: () => api.get(`/tasks?${new URLSearchParams({ limit: String(params.limit) })}`),
});
```

### `staleTime` vs `gcTime`?

`staleTime`: how long data counts as fresh - fresh data is served from cache
with no request. `gcTime`: how long *unused* data stays in memory after the
last component using it unmounts. Default `staleTime` is 0 (refetch on every
mount); this project uses 30 s globally and 5 min for `/auth/me`.

```ts
new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000 } }, // fresh for 30 s: no request
});                                                    // gcTime stays 5 min (default)
```

### What should be retried?

Only what might succeed next time: network failures, 408, 429, 5xx. Never other
4xx - the same request gets the same answer. Never automatically retry
non-idempotent mutations.

```ts
function isTransient(error: unknown) {
  if (!(error instanceof ApiError)) return false; // our own bug: retrying won't help
  const { status } = error;
  return status === 0 || status === 408 || status === 429 || status >= 500;
}
// queries: { retry: (count, error) => isTransient(error) && count < 2 }
// mutations: not retried (the default) - a repeated POST can create twice
```

### Where should query errors be handled?

Centrally, in the `QueryCache`'s `onError`, not in each hook. **In this
project:** a 401 that survived the refresh attempt sets the cached user to
`null`, and the route guard redirects to login. One hook that caught its own
401 and returned `null` would have left a logged-out user staring at an empty
table, with no redirect. The one exception, `/auth/me`, returns `null` on 401
on purpose: for "who am I?", "nobody" is a valid answer.

```ts
new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      if (error instanceof ApiError && error.status === 401) {
        queryClient.setQueryData(ME_KEY, null); // the route guard redirects
      }
    },
  }),
});

// ✗ in a hook: the 401 becomes "no data", onError never fires, no redirect
queryFn: async () => { try { return await api.get("/tasks"); } catch { return null; } }
```

### What does TanStack Query deduplicate?

Identical concurrent queries share one request. **In this project:**
`/auth/me` was requested once per load despite StrictMode and two components
using it (devtools showed two observers).

### How do you implement an optimistic update, and what can go wrong?

`useMutation` with:
1. **`onMutate`**: `cancelQueries` for the affected keys (a refetch already in
   flight would otherwise land after the optimistic write and restore the old
   value), remember what you are about to change, write the new value with
   `setQueriesData`, return the memory as **context**.
2. **`onError`**: put back what you remembered.
3. **`onSettled`**: invalidate, success or failure - the server has the last
   word.

Writes must be immutable: TanStack and React detect changes by reference.
**Structural sharing** keeps unchanged objects' references when new data
arrives, so only changed items re-render if memoised.

Pitfalls:
- **Whole-list snapshots race.** Click A, then B; if A fails, restoring A's
  snapshot (taken before B) also erases B. Remember and restore only the item
  this mutation changed.
- **Not everything should be optimistic.** A create needs a temporary id, and
  the real id changes the React key (unmount + remount). Irreversible actions
  (payments) should wait - showing "paid" and taking it back is worse than a
  short delay.
- Send **the value wanted**, not "toggle": a double click sending `DONE` twice
  lands on `DONE`; two toggles undo each other (idempotency).

**In this project:** click-to-tick ~450 ms → under 50 ms. Failure was forced
with DevTools request blocking (`*://localhost:3000/tasks/*`, which blocks the
PATCH but not `/tasks?limit=100`).

```ts
useMutation({
  mutationFn: ({ id, done }) =>
    api.patch(`/tasks/${id}`, { status: done ? "DONE" : "TODO" }), // the value, not a toggle

  onMutate: async ({ id, done }) => {
    await queryClient.cancelQueries({ queryKey: taskKeys.all });     // stop stale refetches
    const previousStatus = findStatus(id);                           // remember ONE task
    writeStatus(id, done ? "DONE" : "TODO");                         // immutable write
    return { id, previousStatus };                                   // → context
  },
  onError: (_err, _vars, context) => {
    if (context?.previousStatus) writeStatus(context.id, context.previousStatus);
  },
  onSettled: () => queryClient.invalidateQueries({ queryKey: taskKeys.all }),
});

function writeStatus(id, status) {
  queryClient.setQueriesData({ queryKey: taskKeys.lists() }, (list) =>
    list && { ...list, items: list.items.map((t) => (t.id === id ? { ...t, status } : t)) },
  );
}
```

### What is a single-flight refresh?

When several requests get a 401 at once, only one refresh request is sent and
the others await the same promise. **In this project:** without it, the second
refresh reused an already-rotated refresh token, which the server's reuse
detection treats as theft - it revoked every session. Measured: three
refreshes (one 204, two 401) without it; one with it. Not covered: two *tabs*
refreshing at once (they share cookies, not the promise) - Web Locks or a
server-side grace window would fix that.

```ts
let refreshing: Promise<boolean> | null = null;

function refresh() {
  // ??= : only the first caller starts a request; the rest await the same promise
  refreshing ??= fetch(`${BASE}/auth/refresh`, { method: "POST", credentials: "include" })
    .then((res) => res.ok)
    .catch(() => false)
    .finally(() => { refreshing = null; });
  return refreshing;
}
// Measured: with `=` instead of `??=`, three refreshes (one 204, two 401) and a
// revoked session; with `??=`, one.
```

### What is a query key factory, and when is it worth it?

One object that builds every key for a feature as a hierarchy, so each level is
a prefix that targets everything beneath it:

```ts
taskKeys.all          // ["tasks"]
taskKeys.lists()      // ["tasks", "list"]
taskKeys.list(params) // ["tasks", "list", { limit: 100 }]
taskKeys.detail(id)   // ["tasks", "detail", id]
```

Worth it once there is more than one *shape* under a prefix. **In this
project:** rejected while there was one list query (pre-building); adopted when
a detail query arrived, because the checkbox's `setQueriesData(["tasks"])`
updater expected a `TaskList` and would have thrown on a `Task`. Writes now
target `lists()`; invalidation targets `all`.

```ts
export const taskKeys = {
  all: ["tasks"] as const,
  lists: () => [...taskKeys.all, "list"] as const,
  list: (params: { limit: number }) => [...taskKeys.lists(), params] as const,
  detail: (id: string) => [...taskKeys.all, "detail", id] as const,
};

queryClient.setQueriesData({ queryKey: taskKeys.lists() }, updater); // lists only
queryClient.invalidateQueries({ queryKey: taskKeys.all });          // everything
```

### How do you open a detail view instantly using data you already have?

`initialData` seeds a new query from another cache entry (the list), so it
starts in `success` with no request. Add **`initialDataUpdatedAt`** with the
source's age: without it the copy counts as fetched *now* and a stale copy is
treated as fresh. With it, an old copy is shown at once **and** refetched in the
background - stale-while-revalidate.

`placeholderData` differs: shown but never stored, and the query always
fetches. Use it for "something to look at"; use `initialData` when the copy is
real data.

Trap: `initialData` runs once per cache entry. A detail cached from an earlier
open is reused for `gcTime` (5 min) even if the list changed since - so
mutations must invalidate details too.

```ts
useQuery({
  queryKey: taskKeys.detail(id),
  queryFn: () => api.get<Task>(`/tasks/${id}`),
  initialData: () => findInLists(queryClient, id)?.task,              // no request
  initialDataUpdatedAt: () => findInLists(queryClient, id)?.updatedAt, // real age
});
```

### `removeQueries` vs `invalidateQueries`?

Invalidate marks stale and **refetches immediately if anything is observing**.
Remove deletes the entry. **In this project:** after deleting a task, the detail
is *removed* - invalidating would refetch it while the modal still observed it,
and the refetch would 404 on screen.

```ts
// after DELETE /tasks/:id → 204
onDeleted();                                                          // close: unmount observer
queryClient.removeQueries({ queryKey: taskKeys.detail(id), exact: true }); // not invalidate
queryClient.setQueriesData({ queryKey: taskKeys.lists() }, (list) =>
  list && { ...list, items: list.items.filter((t) => t.id !== id) });  // gone this frame
await queryClient.invalidateQueries({ queryKey: taskKeys.lists() });  // server corrects counts
```

### Why write a mutation's response into the cache?

`setQueryData(detail(id), updated)` with the PATCH response makes the cache
correct with zero extra requests; an invalidate would spend a GET learning what
the response already said.

```ts
onSuccess: (updated) => {
  queryClient.setQueryData(taskKeys.detail(updated.id), updated); // 0 requests
  return queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
},
```

### What is a lost update, and how do you prevent it?

Two clients read the same record, both edit, the second save overwrites the
first's change. Sending **only changed fields** narrows it to fields both sides
edited. Closing it needs **optimistic concurrency control** on the server: a
`version` column or an ETag; the client sends `If-Match`, and a mismatch gets
**409/412** instead of a silent overwrite. **In this project:** partial PATCH
now; versioning deferred to Milestone 3, when team sharing makes concurrent
edits real.

```ts
// Client: send only what changed, compared with values frozen at mount
function toPatch(values, initial) {
  const patch = {};
  if (values.title.trim() !== initial.title) patch.title = values.title.trim();
  if (values.dueDate !== initial.dueDate) patch.dueDate = values.dueDate || null; // cleared → null
  return patch;
}
```
```http
# Server-side fix (not built yet): optimistic concurrency with ETags
GET /tasks/42          → 200, ETag: "v7"
PATCH /tasks/42        If-Match: "v7"   → 200 (and the version becomes v8)
PATCH /tasks/42        If-Match: "v7"   → 412 Precondition Failed (someone saved first)
```

### Is DELETE idempotent? How should a client treat a 404 on delete?

The *effect* of DELETE is idempotent (gone is gone); the *response* may differ
(204, then 404). From the user's point of view a 404 means the goal is already
met. **In this project:** a 404 on delete is treated as success.

```ts
mutationFn: async () => {
  try {
    await api.delete(`/tasks/${id}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return; // already gone = done
    throw error;
  }
},
```

---

## 6. State in the URL

### When should UI state live in the URL?

When it should survive a reload, travel in a bookmark or new tab, and work with
Back/Forward - and it is small and public. **In this project:** `?view=table`
(the active view) and `?task=new` (the open modal). Not `useState` (lost on
reload), not `localStorage` (invisible to bookmarks, shared and fought over by
tabs, can throw in private windows).

### `push` or `replace`?

Ask whether the change is something the user would expect Back to undo.
- View toggle: **replace** - switching views is not navigation; Back should
  leave the page, not replay every toggle.
- Opening a modal: **push** - Back should close it (especially on mobile).
- Closing it: **replace**, never `navigate(-1)` - the close handler can fire
  twice, and a user who arrived from a bookmark has no in-app entry to go back to.

Also: validate parameters (anything but `table` means board), keep defaults out
of the URL (one address per screen), and **edit** the existing query string
rather than replacing it, so other parameters survive.

```ts
const [params, setParams] = useSearchParams();

// view toggle: replace, and edit the current params rather than replacing them
setParams((current) => { current.set("view", "table"); return current; }, { replace: true });

// open a modal: push (no replace option), so Back closes it
setParams((current) => { current.set("task", "new"); return current; });

// close it: replace - never navigate(-1), which can fire twice
setParams((current) => { current.delete("task"); return current; }, { replace: true });

// ✗ setParams({ view: "table" }) wipes every other parameter
```

---

## 7. Security in the browser

### Where should auth tokens live?

In **httpOnly cookies**: JavaScript cannot read them, so an XSS payload or a
browser extension cannot steal them. `localStorage` is readable by any script
on the origin. **In this project:** access and refresh tokens are both httpOnly
cookies, `SameSite=Strict`, `Secure`; the refresh cookie is scoped to
`Path=/auth`. Login, refresh and logout return 204 with no body.

```ts
// NestJS (Express) - setting the cookie
res.cookie("access_token", token, {
  httpOnly: true,       // invisible to document.cookie, so XSS can't read it
  secure: true,         // HTTPS only
  sameSite: "strict",   // never sent on requests from another site
  path: "/",
  maxAge: 15 * 60 * 1000,
});

// Frontend - send it on every request
fetch(url, { credentials: "include" });

// ✗ readable by any script on the page, including injected ones and extensions
localStorage.setItem("token", token);
```

### Origin vs site? And what does SameSite do?

**Origin** = scheme + host + port. **Site** = scheme + registrable domain
(`example.com`); ports do not count. `SameSite` controls whether a cookie is
sent on requests initiated from *another site*: `Strict` never, `Lax` only on
top-level GET navigations (Chrome's default), `None` always (requires
`Secure`). `localhost:5173` → `localhost:3000` is cross-origin but same-site.

### How is CSRF prevented when using cookies?

Layers: `SameSite=Strict` (the cookie is not sent from other sites), the API
accepts only JSON bodies (an HTML form cannot send `application/json`), and a
JSON request is non-simple, so it needs a CORS preflight the API refuses for
unknown origins.

### What does CORS protect?

**Users, not the API.** It is enforced by the browser: it stops a malicious
page from reading responses from your API using the victim's cookies. `curl`
ignores it entirely. Details: simple requests (GET/POST with simple headers)
are sent without a preflight; others get an `OPTIONS` preflight first;
`Access-Control-Max-Age` caches the preflight (Chromium caps it at 2 hours);
`credentials: true` forbids `Access-Control-Allow-Origin: *`; reflecting any
origin (`origin: true`) with credentials is a vulnerability; send
`Vary: Origin` when the header depends on the request; response headers are
hidden from JavaScript unless listed in `exposedHeaders`.

```ts
app.enableCors({
  origin: config.get("WEB_ORIGIN"),   // one exact origin - never "*" or `true` with credentials
  credentials: true,                  // allow cookies on cross-origin requests
  methods: ["GET", "POST", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type"],
  exposedHeaders: ["X-Request-Id"],   // otherwise JS can't read it
  maxAge: 7200,                       // cache the preflight (Chromium caps at 2 h)
});
```

### What is IDOR, and where must ownership be enforced?

Insecure Direct Object Reference: accessing someone else's record by changing an
id in a URL or request. Ownership must be enforced **on the server, in the
query itself** - hiding a button protects nothing. **In this project:** every
task query filters on `userId` in the `where` clause, and another user's task
returns **404, not 403**, so the API does not even confirm it exists. The UI
shows the same message for 404 and 400 (not a UUID).

```ts
// ✗ fetches by id alone - hands any task to anyone who knows its id
prisma.task.findUnique({ where: { id } });

// ✓ ownership is part of the query: someone else's task is never selected → 404
prisma.task.findFirst({ where: { id, userId } });
prisma.task.updateMany({ where: { id, userId }, data });
```

### What is an open redirect?

A login page that redirects to a URL taken from the query string
(`/login?next=https://evil.example`) lets anyone craft a genuine-looking link
that ends somewhere hostile. **In this project:** the return location is kept
in router history state, which cannot be set from outside the app.

```tsx
// ✗ attacker-controlled: /login?next=https://evil.example
navigate(new URLSearchParams(location.search).get("next") ?? "/");

// ✓ router state can only be set by the app itself
<Navigate to="/login" replace state={{ from: location }} />
const returnTo = location.state?.from?.pathname ?? "/";
```

### Are build-time environment variables secret?

No. `import.meta.env.VITE_*` values are inlined into the bundle as literals -
anyone can read them. One bundle per environment.

### What should logout do on the client?

Clear the whole query cache (another user on the same machine must not see the
previous user's data), then set the current user to `null` - in that order,
because `clear()` would undo the second step.

```ts
onSuccess: () => {
  queryClient.clear();                  // the previous user's data, all of it
  queryClient.setQueryData(ME_KEY, null); // after clear(), or clear() undoes it
  navigate("/login", { replace: true });
},
```

### How do you defend against supply-chain attacks in npm dependencies?

- **Minimum release age** (pnpm `minimumReleaseAge`): refuse versions published
  in the last day - a compromised release is most dangerous in its first hours.
  pnpm checks the **lockfile itself**, so a lockfile committed with a bypass is
  rejected too. Fixing a violation: move to the previous, aged version; never
  add exclusions as the fix.
- **Install scripts denied by default**, allowed one package at a time
  (`allowBuilds`).
- **Strict isolation** prevents phantom dependencies (importing a package you
  never declared).

```yaml
# pnpm-workspace.yaml
minimumReleaseAge: 1440        # minutes: refuse versions under a day old
allowBuilds:                   # install scripts are denied unless listed
  prisma: true
  protobufjs: false            # decided, not left undecided
```

### What is a silent failure, and how did one happen here?

A request that "succeeds" without doing anything. **In this project:** the
first draft of the checkbox sent `{ done: true }`; the API has `status`, not
`done`. NestJS's `ValidationPipe` with `whitelist: true` **strips** unknown
fields, so the PATCH returned 200 with the task unchanged - no error anywhere.
`forbidNonWhitelisted: true` would turn it into a 400. Lesson: read the DTO or
OpenAPI docs before writing a request.

```ts
// NestJS global pipe
new ValidationPipe({
  whitelist: true,              // strips unknown fields: { done: true } → {} → 200, nothing changed
  forbidNonWhitelisted: true,   // proposed (ADR 0009): unknown fields → 400 "property done should not exist"
  transform: true,
});
```

---

## 8. Accessibility

- **Toggle buttons:** `role="group"` + `aria-pressed` - a screen reader hears
  "Board, toggle button, pressed", not two unrelated buttons.
- **Repeated controls need distinct names:** 100 checkboxes each get
  `aria-label="Done: <title>"`, not 100 "checkbox"es.
- **Live regions must exist before their content changes:** screen readers
  announce changes inside an existing `aria-live` region and often miss one
  inserted already filled. `assertive` for errors caused by the user's action.
- **No auto-dismissing errors** (WCAG 2.2.1 Timing Adjustable): a message that
  vanishes after 5 s can be gone before someone reads it.
- **Errors must appear where the user is looking:** an error above a 100-row
  table is invisible to someone who clicked row 60 - hence a fixed-position
  toast.
- **Native `<dialog>` with `showModal()`:** top layer, inert background, Escape,
  focus moved in and restored. A `div role="dialog"` needs all of that
  rebuilt in JavaScript.
- **Wrapping an input in its `<label>`** associates them without ids.
- **`<button>`, not `<div onClick>`:** Tab order, Enter and Space, the button
  role and `:focus-visible` come free; a div needs `tabIndex`, `role` and key
  handling to approach it.
- **Content model:** a `<button>` may contain only phrasing content (`span`,
  not `p` or `div`). Browsers render invalid nesting anyway; the accessibility
  tree may not match.
- **Focus management when an element disappears:** if the focused element is
  removed, focus falls to `<body>` and a screen-reader user is lost. Move it
  deliberately (`autoFocus`, or `.focus()` after the re-render).
- **Two-step confirmation must use a different button:** relabelling one button
  ("Delete" → "Confirm") keeps focus on it, so Enter twice deletes. Replace it
  with Cancel/Delete and focus Cancel.
- **Avoid `window.confirm()`:** synchronous - blocks the main thread (timers,
  rendering, network callbacks) until answered, counts against INP, cannot be
  styled, and can be silently suppressed by the browser.

### Accessibility in code

```tsx
// Toggle buttons
<div role="group" aria-label="View">
  <button type="button" aria-pressed={view === "board"} onClick={...}>Board</button>
  <button type="button" aria-pressed={view === "table"} onClick={...}>Table</button>
</div>

// ✗ not focusable, no Enter/Space, not announced as clickable
<div onClick={() => open(task.id)}>{task.title}</div>
// ✓ and only phrasing content inside a button
<button type="button" onClick={() => open(task.id)}>
  <span className="block">{task.title}</span>
</button>

// Distinct names for repeated controls
<input type="checkbox" aria-label={`Done: ${task.title}`} />

// A live region that exists before its content changes
<div aria-live="assertive">{message && <p>{message}</p>}</div>

// A modal: showModal(), not the open attribute
useEffect(() => {
  if (open && !dialog.open) dialog.showModal();   // top layer, inert page, Escape, focus
  if (!open && dialog.open) dialog.close();
}, [open]);
<dialog ref={ref} onClose={onClose} aria-labelledby={titleId}>...</dialog>

// Moving focus when the focused element is about to disappear
<button type="button" autoFocus onClick={cancel}>Cancel</button>
requestAnimationFrame(() => deleteButton.current?.focus());
```


---

## 9. Dates and time zones

### Why do due dates show a day early for some users?

A date-only value (`2026-10-16`) is stored as midnight **UTC**. Formatted in
the viewer's time zone, New York (UTC−4) sees 20:00 on the 15th. Format date-only
values with `timeZone: "UTC"`; format real moments (`createdAt`) in the viewer's
zone. Nigeria (UTC+1) never sees the bug - you cannot catch it by testing
locally.

Related:
- `new Date("2026-10-16")` parses as UTC; `new Date("2026-10-16T00:00")` as
  local time.
- `YYYY-MM-DD` strings sort in calendar order, so "overdue" can be a string
  comparison against the viewer's *local* date - no time zone arithmetic.
- `<input type="date">` gives `YYYY-MM-DD`; send it unchanged.
- Build `Intl.DateTimeFormat` once per module, not per cell - constructing one
  loads locale data. Pass `undefined` as the locale to use the viewer's.

```ts
// A calendar day stored as midnight UTC: format it IN UTC
const dueFormat = new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", timeZone: "UTC" });
dueFormat.format(new Date("2026-10-16T00:00:00Z")); // "Oct 16" everywhere
// without timeZone: "Oct 15" in New York

// A real moment: viewer's zone (the default)
const createdFormat = new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short" });

// "Overdue" as a string comparison against the viewer's local date
function localToday() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}
const overdue = task.status !== "DONE" && task.dueDate !== null && task.dueDate.slice(0, 10) < localToday();
```
