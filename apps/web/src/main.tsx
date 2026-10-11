import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./index.css";
import { api } from "./lib/api";

// The scaffold used `getElementById("root")!`. The `!` tells TypeScript to trust
// that the element exists; if index.html ever changes, React fails later with an
// error that names neither the element nor the file.
const root = document.getElementById("root");
if (!root) {
  throw new Error('No element with id="root" in index.html');
}

// Console access for testing the client by hand. import.meta.env.DEV is replaced
// with `false` in a production build, so this whole statement is dead code there
// and the minifier removes it - it never ships.
if (import.meta.env.DEV) {
  Object.assign(window, { api });
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
