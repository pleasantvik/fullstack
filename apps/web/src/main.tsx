import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./index.css";

// The scaffold used `getElementById("root")!`. The `!` tells TypeScript to trust
// that the element exists; if index.html ever changes, React fails later with an
// error that names neither the element nor the file.
const root = document.getElementById("root");
if (!root) {
  throw new Error('No element with id="root" in index.html');
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
