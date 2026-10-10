import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  // VITE_* values are inlined into the bundle as string literals. A missing one
  // becomes `undefined` in a user's browser with no error anywhere, so the only
  // place fail-fast can happen is here, before the build.
  // import.meta.dirname, not process.cwd(): resolve .env next to this file
  // regardless of where the command was run from.
  const env = loadEnv(mode, import.meta.dirname);

  if (!env.VITE_API_URL) {
    throw new Error("VITE_API_URL is not set. See apps/web/.env.example.");
  }
  try {
    new URL(env.VITE_API_URL);
  } catch {
    throw new Error(`VITE_API_URL is not a valid URL: ${env.VITE_API_URL}`);
  }

  return {
    plugins: [react(), tailwindcss()],
    server: {
      // Vite binds to 127.0.0.1 by default. VirtualBox's port forward delivers
      // to the VM's network interface, not its loopback, so a loopback-only
      // server is unreachable from Windows. Nest binds all interfaces by
      // default, which is why the API never had this problem.
      host: true,
      port: 5173,
      // 5173 is the forwarded port. If it is taken, fail loudly rather than
      // quietly moving to 5174, which nothing forwards.
      strictPort: true,
    },
  };
});
