import { Navigate, Outlet, useLocation } from "react-router";
import { BoardSkeleton } from "../components/board-skeleton";
import { ServerUnreachable } from "../components/server-unreachable";
import { useMe } from "./use-me";

// The order of these checks is the whole design: nothing redirects until there
// is an answer to redirect on.
export function RequireAuth() {
  const me = useMe();
  const location = useLocation();

  if (me.isPending) {
    return <BoardSkeleton />;
  }

  if (me.isError) {
    return <ServerUnreachable onRetry={() => void me.refetch()} />;
  }

  if (me.data === null) {
    // `replace` keeps this URL out of history, so Back from the login page
    // doesn't bounce straight back here. `from` returns the user to where they
    // were once they've logged in.
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
