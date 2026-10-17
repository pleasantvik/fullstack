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
