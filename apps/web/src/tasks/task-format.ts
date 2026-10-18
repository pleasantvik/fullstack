import type { TaskStatus, TaskPriority } from "./use-tasks";

export const PRIORITY_LABEL: Record<TaskPriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};

export const STATUS_LABEL: Record<TaskStatus, string> = {
  TODO: "To do",
  IN_PROGRESS: "In progress",
  DONE: "Done",
};

// A due date is a calendar day, stored as midnight UTC. Formatted in local time
// it shows the previous day anywhere west of Greenwich, so it is read in UTC.
export const dueFormat = new Intl.DateTimeFormat(undefined, {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

// Built once per module, not once per cell: constructing a formatter loads
// locale data, and a 100-row table would do it 100 times every render.
// createdAt is a real moment, so it is read in the viewer's own zone.
export const createdFormat = new Intl.DateTimeFormat(undefined, {
  day: "numeric",
  month: "short",
});
