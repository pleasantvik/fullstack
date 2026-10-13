import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

// Upper case because they are Postgres enum values - see schema.prisma.
export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

// Dates are strings: JSON has no date type, so they arrive as ISO text and
// stay that way until something parses them.
export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TaskList {
  items: Task[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export const TASKS_KEY = ["tasks"] as const;

export function useTasks() {
  // The API's maximum. Its default is 20, which would silently drop the 21st
  // task. Paging is Milestone 5; until then, `total` shows any shortfall.
  const params = { limit: 100 };

  return useQuery({
    queryKey: [...TASKS_KEY, params],
    queryFn: () =>
      api.get<TaskList>(`/tasks?${new URLSearchParams({ limit: String(params.limit) })}`),
  });
}
