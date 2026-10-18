import type { RegisterOptions } from "react-hook-form";
import type { Task, TaskPriority, TaskStatus } from "./use-tasks";

// What the form holds: every field a string, as inputs give them.
export interface TaskFields {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
}

export const EMPTY_TASK: TaskFields = {
  title: "",
  description: "",
  status: "TODO",
  priority: "MEDIUM",
  dueDate: "",
};

// A task as the form's starting values. dueDate keeps only the date part:
// it is stored as midnight UTC, so its first ten characters are the day.
export function toFields(task: Task): TaskFields {
  return {
    title: task.title,
    description: task.description ?? "",
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate?.slice(0, 10) ?? "",
  };
}

// Mirrors CreateTaskDto. The trim check catches a title of only spaces, which
// @IsNotEmpty on the server would accept.
export const FIELD_RULES: { [K in keyof TaskFields]: RegisterOptions<TaskFields, K> } = {
  title: {
    required: "Give the task a title.",
    validate: (value) => value.trim() !== "" || "Give the task a title.",
    maxLength: { value: 200, message: "Keep the title under 200 characters." },
  },
  description: {
    maxLength: { value: 2000, message: "Keep the description under 2,000 characters." },
  },
  status: {},
  priority: {},
  dueDate: {},
};
