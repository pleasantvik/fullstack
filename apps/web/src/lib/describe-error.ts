import { ApiError } from "./api";

// A sentence for a person, from an error the API client threw. The request id
// is the one generated in 1.3d and exposed in 1.6b - shown so a user can quote
// it, and the matching log line can be found in one search.
export function describeError(error: Error): string {
  if (error instanceof ApiError) {
    if (error.status === 0) return "Can't reach the server. Check your connection.";
    if (error.requestId) return `Something went wrong (reference ${error.requestId}).`;
  }
  return "Something went wrong.";
}
