import { createBrowserRouter, Navigate } from "react-router";
import { RequireAuth } from "./auth/require-auth";
import { TasksPage } from "./routes/tasks";
import { LoginPage } from "./routes/login";
import { RegisterPage } from "./routes/register";

// Data mode, without loaders for now. In 1.6f a loader can start fetching
// before a page's code has even rendered - an LCP experiment that's a small
// change from here rather than a router rewrite.
export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  {
    // A pathless layout route. Anything nested here is protected without being
    // named - the frontend counterpart of the global guard from 1.4c.
    element: <RequireAuth />,
    children: [{ path: "/", element: <TasksPage /> }],
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);
