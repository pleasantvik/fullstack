// Without this, ImportMetaEnv extends Record<string, any>, so declaring
// VITE_API_URL below types it - but import.meta.env.VITE_API_ULR still compiles,
// as `any`, and inlines undefined. This removes the catch-all.
interface ViteTypeOptions {
  strictImportMetaEnv: unknown;
}

// Every VITE_* variable the app reads. Each is public: inlined into the bundle
// as plain text. Nothing secret ever belongs here.
interface ImportMetaEnv {
  readonly VITE_API_URL: string;
}
