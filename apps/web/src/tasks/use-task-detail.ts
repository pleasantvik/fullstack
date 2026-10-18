import { ApiError } from "../lib/api";
import { describeError } from "../lib/describe-error";
import { useTask } from "./use-tasks";

// useTask plus what its failure means to a user. 404: deleted, or someone
// else's (the API never says which). 400: the id in the URL is not a UUID at
// all. Both mean "nothing to edit here".
export function useTaskDetail(id: string) {
  const query = useTask(id);

  const missing =
    query.error instanceof ApiError && (query.error.status === 404 || query.error.status === 400);

  return {
    task: query.data,
    isPending: query.isPending,
    error: query.isError
      ? missing
        ? "This task doesn't exist, or it has been deleted."
        : describeError(query.error)
      : null,
  };
}
