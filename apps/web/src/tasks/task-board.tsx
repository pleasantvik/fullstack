import { describeError } from "../lib/describe-error";
import { PRIORITY_LABEL, STATUS_LABEL, dueFormat } from "./task-format";
import {
  type Task,
  type TaskPriority,
  type TaskStatus,
  useTasks,
} from "./use-tasks";

const COLUMNS: TaskStatus[] = ["TODO", "IN_PROGRESS", "DONE"];

// Derived on every render, never stored: the cache stays the only copy, so a
// refetch or an optimistic update can't leave the board disagreeing with it.
function groupByStatus(items: Task[]): Record<TaskStatus, Task[]> {
  const groups: Record<TaskStatus, Task[]> = {
    TODO: [],
    IN_PROGRESS: [],
    DONE: [],
  };
  for (const task of items) groups[task.status].push(task);
  return groups;
}

// The viewer's calendar day as YYYY-MM-DD, comparable as a string with the
// date part of a due date. Local, not UTC: "overdue" means past the day the
// user is living in.
function localToday(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function TaskBoard() {
  const tasks = useTasks();

  if (tasks.isPending) {
    return <p className="text-sm text-text-muted">Loading tasks...</p>;
  }

  if (tasks.isError) {
    return (
      <div role="alert" className="text-sm">
        <p className="text-danger">{describeError(tasks.error)}</p>
        <button
          type="button"
          onClick={() => void tasks.refetch()}
          className="mt-2 rounded-lg border border-border px-3 py-1.5"
        >
          Try again
        </button>
      </div>
    );
  }

  const groups = groupByStatus(tasks.data.items);
  const today = localToday();

  return (
    <div className="grid grid-cols-3 gap-3">
      {COLUMNS.map((status) => (
        <Column
          key={status}
          status={status}
          tasks={groups[status]}
          today={today}
        />
      ))}
    </div>
  );
}

function Column({
  status,
  tasks,
  today,
}: {
  status: TaskStatus;
  tasks: Task[];
  today: string;
}) {
  return (
    // 6.5rem = the 56px top bar plus the page's 24px padding above and below,
    // so each column scrolls on its own instead of the whole page.
    <section className="flex max-h-[calc(100vh-6.5rem)] flex-col rounded-xl bg-surface-muted">
      <h2 className="flex items-center gap-2 px-3 pt-3 pb-2 text-label font-medium text-text-muted">
        {STATUS_LABEL[status]}
        <span className="rounded-full bg-surface px-2 text-text">
          {tasks.length}
        </span>
      </h2>

      {tasks.length === 0 ? (
        <p className="px-3 pb-3 text-sm text-text-muted">Nothing here.</p>
      ) : (
        <ul className="flex flex-col gap-2 overflow-y-auto px-3 pb-3">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} today={today} />
          ))}
        </ul>
      )}
    </section>
  );
}

const PRIORITY_CHIP: Record<TaskPriority, string> = {
  HIGH: "border-danger text-danger",
  MEDIUM: "border-warning text-warning",
  LOW: "border-border text-text-muted",
};

function TaskCard({ task, today }: { task: Task; today: string }) {
  // A finished task is never overdue, however late it was finished.
  const overdue =
    task.status !== "DONE" &&
    task.dueDate !== null &&
    task.dueDate.slice(0, 10) < today;

  return (
    <li className="rounded-lg border border-border bg-surface p-3">
      <p className="text-sm break-words">{task.title}</p>
      <div className="mt-2 flex items-center gap-2 text-label">
        <span
          className={`rounded-full border px-2 ${PRIORITY_CHIP[task.priority]}`}
        >
          {PRIORITY_LABEL[task.priority]}
        </span>
        {task.dueDate && (
          <span className={overdue ? "text-danger" : "text-text-muted"}>
            {overdue && "Overdue · "}
            {dueFormat.format(new Date(task.dueDate))}
          </span>
        )}
      </div>
    </li>
  );
}
