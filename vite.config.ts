import { defineConfig } from "vite";

// Bind to IPv4 loopback: by default Vite listens on [::1] only, which
// VS Code's devcontainer port forwarding (IPv4) can't reach.
export default defineConfig({
  server: { host: "127.0.0.1" },
  preview: { host: "127.0.0.1" },
});
