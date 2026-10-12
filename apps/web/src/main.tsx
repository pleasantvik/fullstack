import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// From react-router/dom, not react-router: this one uses react-dom's flushSync
// for navigation updates. The main entry's version is renderer-agnostic.
import { RouterProvider } from "react-router/dom";
import "./index.css";
import { api } from "./lib/api";
import { queryClient } from "./lib/query-client";
import { router } from "./router";

// The scaffold used `getElementById("root")!`. The `!` tells TypeScript to trust
// that the element exists; if index.html ever changes, React fails later with an
// error that names neither the element nor the file.
const root = document.getElementById("root");
if (!root) {
  throw new Error('No element with id="root" in index.html');
}

// Console access for testing by hand. import.meta.env.DEV is replaced with
// `false` in a production build, so this is dead code there and never ships.
if (import.meta.env.DEV) {
  Object.assign(window, { api, queryClient });
}

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      {/* Renders nothing in a production build. */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </StrictMode>,
);
