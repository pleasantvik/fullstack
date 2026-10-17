import { useSearchParams } from "react-router";

// ?task=new opens the create form; ?task=<id> will open edit (5b). In the URL so
// it survives a reload and Back closes it.
export function useTaskModal() {
  const [params, setParams] = useSearchParams();

  // Pushes a history entry, unlike the view toggle: opening a modal feels like
  // going somewhere, so Back is expected to close it.
  function openNew() {
    setParams((current) => {
      current.set("task", "new");
      return current;
    });
  }

  // replace, never navigate(-1): Modal's onClose can fire twice (once from the
  // button, once from the dialog's close event), and two steps back leaves the
  // app. A user who arrived on /?task=new from a bookmark has no in-app entry
  // to go back to anyway.
  function close() {
    setParams(
      (current) => {
        current.delete("task");
        return current;
      },
      { replace: true },
    );
  }

  return { task: params.get("task"), openNew, close };
}
