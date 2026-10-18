import { type QueryClient, useQuery, useQueryClient } from "@tanstack/react-query";
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

// Every task key is built here, as a hierarchy: each level is a prefix that
// targets everything beneath it. Lists and details hold different shapes
// (TaskList vs Task), so code that rewrites lists must target lists() only.
export const taskKeys = {
  all: ["tasks"] as const,
  lists: () => [...taskKeys.all, "list"] as const,
  list: (params: { limit: number }) => [...taskKeys.lists(), params] as const,
  detail: (id: string) => [...taskKeys.all, "detail", id] as const,
};

export function useTasks() {
  // The API's maximum. Its default is 20, which would silently drop the 21st
  // task. Paging is Milestone 5; until then, `total` shows any shortfall.
  const params = { limit: 100 };

  return useQuery({
    queryKey: taskKeys.list(params),
    queryFn: () =>
      api.get<TaskList>(`/tasks?${new URLSearchParams({ limit: String(params.limit) })}`),
  });
}

// The task as it appears in any cached list, with that list's age.
function findInLists(queryClient: QueryClient, id: string) {
  for (const query of queryClient.getQueryCache().findAll({ queryKey: taskKeys.lists() })) {
    const task = (query.state.data as TaskList | undefined)?.items.find((t) => t.id === id);
    if (task) return { task, updatedAt: query.state.dataUpdatedAt };
  }
  return undefined;
}

export function useTask(id: string) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: taskKeys.detail(id),
    queryFn: () => api.get<Task>(`/tasks/${id}`),
    // Seeded from the list when the task is there, so the modal opens with no
    // request. The list's own age goes with it: without initialDataUpdatedAt
    // the copy would count as fetched just now, however old the list was.
    initialData: () => findInLists(queryClient, id)?.task,
    initialDataUpdatedAt: () => findInLists(queryClient, id)?.updatedAt,
  });
}
