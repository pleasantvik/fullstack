# How to brief a design tool for a milestone

Any design tool — Claude Design, Figma, anything else — starts with no memory of this project. The brief has to carry everything. This file makes that cheap.

## Source of truth

`docs/design/ui-spec.md` is authoritative. Figma files and Claude Design canvases are **renderings** of it, not replacements for it.

After any design session, write the decisions back into `ui-spec.md` — new components, changed tokens, layout rules you settled on. If you skip this, the next milestone's brief will be wrong and Claude Code will build against a stale spec.

## The brief template

Copy this, fill the four bracketed parts from `ui-spec.md`, paste it in.

---

**Context**

I'm building a task manager as a personal learning project, shipping incrementally across five milestones. I'm on **Milestone [N] — [name]**. The design system was fixed in Milestone 1 and gets **extended, never replaced**.

**Design system — use these exactly**

[Paste the entire "Design tokens" section of ui-spec.md — colour table, typography, spacing and shape.]

**What already exists**

[Paste the component lists from every completed milestone. These are built. Don't redesign them — match them.]

**What I need designed now**

[Paste the component list for the current milestone only.]

**Constraints**

- Extend the existing system. No new colours, fonts, radii, or spacing values unless the current components genuinely cannot be built without one — and if so, say which and why.
- Don't design anything from a later milestone, even if it seems obviously needed. Later milestones cover: [paste the remaining milestones' component lists as a short list].
- Sentence case everywhere. Two font weights only, 400 and 500. No shadows except focus rings.
- Every component needs its empty, loading, and error state, not just the happy path.

**Output**

Show each component at the sizes it will actually be used. Then give me a short written spec — the same format as the sections above — that I can paste back into `ui-spec.md`.

---

## Worked example — the Milestone 2 brief

For October you'd fill it in like this:

- **Milestone** — 2, attachments and background jobs
- **Already exists** — the full Milestone 1 list: buttons, inputs, task card, column, table row, modal shell, toast, view toggle, avatar, skeleton
- **Need now** — attachment drop zone, file list row, upload progress bar, image thumbnail grid, upload failure state with retry, toast variant for background job completion
- **Later milestones** — workspace switcher and role badges (M3), presence and notification bell (M4), search and activity feed (M5)

That's four copy-pastes out of `ui-spec.md`. Under two minutes.

## Things worth saying in the brief that aren't obvious

**Name the surrounding context.** "This drop zone sits inside the task detail modal, which is 512px wide with 24px padding." Without it you'll get a component designed for a full page that doesn't fit.

**Ask for the awkward states first.** A file list looks fine with three files. Ask for it with one file, with twenty, with a filename that's 90 characters long, and mid-upload at 40%. Those are the states that break real layouts.

**Say what the data actually is.** Real task titles from your own backlog, real file sizes, real dates. Lorem ipsum hides length problems.

## After the session

1. Write the new components into `ui-spec.md` under the current milestone
2. Note any token additions in the design tokens section
3. If you're keeping the Figma file current, add a new page named for the milestone (`M2 — October`) rather than editing earlier pages — the file then mirrors the same incremental history as the repo
