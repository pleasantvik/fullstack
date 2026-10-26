// Without this, ImportMetaEnv extends Record<string, any>, so a misspelt
// import.meta.env.VITE_ANYTHING compiles as `any` and inlines undefined. This
// removes the catch-all: every VITE_* variable must be declared below.
interface ViteTypeOptions {
  strictImportMetaEnv: unknown;
}

// Every VITE_* variable the app reads - none today: the API address is a
// relative /api (ADR 0010). Each would be public, inlined into the bundle as
// plain text, and baked in per build. Prefer not to add one.
interface ImportMetaEnv {}
