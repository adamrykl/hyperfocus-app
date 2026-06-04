import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/**
 * Vite configuration for Hyperfocus Tauri v2 application.
 * Port 1420 is the standard Tauri development server port.
 */
export default defineConfig(async () => ({
  plugins: [react()],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
}));
