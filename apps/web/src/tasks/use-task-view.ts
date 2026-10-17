import { useSearchParams } from "react-router";

export type TaskView = "board" | "table";

// In the URL rather than useState or localStorage: it survives a reload, rides
// along in a bookmark or new tab, and costs nothing.
export function useTaskView() {
  const [params, setParams] = useSearchParams();

  // Anyone can type ?view=banana. Only the one known alternative is honoured.
  const view: TaskView = params.get("view") === "table" ? "table" : "board";

  function setView(next: TaskView) {
    setParams(
      (current) => {
        // The default stays out of the URL, so "/" and "/?view=board" are not
        // two addresses for the same screen.
        if (next === "board") current.delete("view");
        else current.set("view", next);
        return current;
      },
      // Flipping views is not navigation: Back should leave the page, not
      // replay every toggle.
      { replace: true },
    );
  }

  return { view, setView };
}
