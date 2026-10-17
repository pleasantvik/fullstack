import { type ReactNode, useEffect, useId, useRef } from "react";

// showModal(), never the `open` attribute: only showModal() gives the top layer,
// an inert page behind, Escape to close, and focus moved in and restored after.
// React's `open` prop is the source of truth; the effect makes the element
// follow it, and the element's close event reports back when the browser closes
// it itself (Escape).
export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby={titleId}
      // m-auto restores the browser's centring, which Tailwind's preflight
      // removes by zeroing every element's margin.
      className="m-auto w-full max-w-lg rounded-xl border border-border bg-surface p-6 text-text shadow-xl backdrop:bg-black/40"
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 id={titleId} className="text-base font-medium">
          {title}
        </h2>
        <button type="button" onClick={onClose} aria-label="Close" className="text-text-muted">
          ✕
        </button>
      </div>
      {/* Unmounted while closed, so a reopened form starts empty rather than
          showing the last attempt. */}
      {open && children}
    </dialog>
  );
}
