import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
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
    // Development plays the part Nginx plays in the image (ADR 0010): the
    // browser calls /api on this origin and the request is passed to the API
    // unchanged - prefix included, because the API owns it. Same origin in
    // development too, so CORS and cookies behave as they will in production.
    // localhost here is the VM, where the API listens - from start:dev or the
    // Compose api service.
    proxy: {
      "/api": "http://localhost:3000",
    },
  },
});
