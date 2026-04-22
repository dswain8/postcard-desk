import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { localApi } from "./vite-plugins/local-api";

export default defineConfig({
  plugins: [react(), localApi()],
  server: {
    port: 5180,
    strictPort: false,
    open: true,
  },
});
