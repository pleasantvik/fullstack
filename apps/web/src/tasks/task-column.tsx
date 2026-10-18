import { TaskCard } from "./task-card";
import { STATUS_LABEL } from "./task-format";
import type { Task, TaskStatus } from "./use-tasks";

export function TaskColumn({
  status,
  tasks,
  today,
  onOpen,
}: {
  status: TaskStatus;
  tasks: Task[];
  today: string;
  onOpen: (id: string) => void;
}) {
  return (
    // 6.5rem = the 56px top bar plus the page's 24px padding above and below,
    // so each column scrolls on its own instead of the whole page.
    <section className="flex max-h-[calc(100vh-6.5rem)] flex-col rounded-xl bg-surface-muted">
      <h2 className="flex items-center gap-2 px-3 pt-3 pb-2 text-label font-medium text-text-muted">
        {STATUS_LABEL[status]}
        <span className="rounded-full bg-surface px-2 text-text">{tasks.length}</span>
      </h2>

      {tasks.length === 0 ? (
        <p className="px-3 pb-3 text-sm text-text-muted">Nothing here.</p>
      ) : (
        <ul className="flex flex-col gap-2 overflow-y-auto px-3 pb-3">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} today={today} onOpen={onOpen} />
          ))}
        </ul>
      )}
    </section>
  );
}
