# UI specification

The design system is established in Milestone 1 and **extended, never replaced**. Every later milestone adds components; none redefines the foundations.

**Rule for Claude Code:** build only the screens and components listed under the active milestone. If asked for something from a later milestone, say which one it belongs to and don't build it.

---

## Design tokens

### Colour

Figma holds the light values only — the plan there is capped at one variable mode. The dark ramp lives in `tailwind.config.js` and is applied with Tailwind's `dark:` variants. If you go looking for a dark mode in the Figma file, that's why it isn't there.

| Token | Light | Dark | Use |
|---|---|---|---|
| `bg` | `#FAFAF9` | `#18181B` | Page background |
| `surface` | `#FFFFFF` | `#232326` | Cards, modals |
| `surface-muted` | `#F4F4F2` | `#2A2A2E` | Column backgrounds, done cards |
| `border` | `#E5E5E1` | `#33333A` | Hairlines |
| `text` | `#1C1C1A` | `#F4F4F2` | Primary |
| `text-muted` | `#6B6B66` | `#9C9CA3` | Secondary, metadata |
| `accent` | `#2563EB` | `#3B82F6` | Primary actions, focus |
| `danger` | `#DC2626` | `#EF4444` | High priority, destructive, overdue |
| `warning` | `#D97706` | `#F59E0B` | Medium priority |
| `success` | `#16A34A` | `#22C55E` | Done, healthy |

Priority chips use a tinted background from the same family, never a solid fill.

### Typography

Inter (or system sans). Two weights only: 400 and 500.

| Role | Size | Weight |
|---|---|---|
| Page title | 20px | 500 |
| Section / column header | 13px | 500 |
| Card title | 14px | 400 |
| Body | 14px | 400 |
| Metadata, chips | 12px | 400 |

Sentence case everywhere. No title case, no all caps.

### Spacing and shape

4px base scale: 4, 8, 12, 16, 24, 32.
Radius: 8px controls, 12px cards and modals.
Borders: 1px, always the `border` token. No shadows except focus rings.

---

## Screen and component inventory by milestone

### Milestone 1 — September

**Screens**
- `/login` — email, password, error state, link to register
- `/register` — name, email, password, validation errors
- `/` — two views behind a Board / Table toggle in the top bar:
  - **Board** — three status columns of cards. Good for seeing flow.
  - **Table** — one row per task with Status, Priority, Due, Created columns. Good for scanning, and the view that later carries sorting and pagination.
- Task modal over `/` — title, description, status, priority, due date, delete

The toggle is a single piece of client state. Both views read the same query; only the presentation differs. Build the table first — it's simpler — then the board.

**Components**
- View toggle (segmented control, two options)
- Table — header row, data row, checkbox cell, sortable column header
- Button (primary, secondary, ghost, danger)
- Text input, textarea, select, date picker
- Task card — title, priority chip, due date, overdue state
- Column — header with count, card list, empty state
- Modal shell
- Toast
- Avatar / initials circle
- Loading skeleton for the board

**States to build:** empty board, loading, network error, form validation errors.

### Milestone 2 — October

- Attachment drop zone in the task modal
- File list row — icon, name, size, download, delete
- Upload progress bar
- Image thumbnail grid
- Upload failure state with retry
- Toast variant for background job completion

### Milestone 3 — November

- Workspace switcher in the top bar
- Members list with role badges
- Invite modal
- Role selector
- Permission-aware disabled states — controls stay visible but inert, with a reason on interaction
- "No access" empty state

### Milestone 4 — December

- Presence indicators (avatar stack on a card)
- Live-update transition on task cards — subtle, not distracting
- Notification bell with unread count and dropdown
- Connection status indicator
- Reconnecting banner

### Milestone 5 — January

- Sortable column headers and pagination on the table view
- Search bar with typeahead results
- Filters panel (status, priority, assignee, date range)
- Activity feed — grouped by day, actor plus action plus target
- Polish pass on every empty, loading, and error state

---

## Layout

Top bar is fixed height, 56px, and holds the title, view toggle, search, and New task button.

Board view: columns are equal width with a 12px gutter, scrolling independently at small heights.

Table view: the Task column flexes; Status (132px), Priority (110px), Due (132px), and Created (110px) are fixed. Rows are 44px with a 1px bottom hairline, and the whole table sits in a 12px-radius card.

Mobile: columns stack vertically with a status tab selector. Not built until Milestone 5 unless it becomes a real irritation sooner.
