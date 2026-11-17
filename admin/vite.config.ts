import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    include: ["test/**/*.spec.ts"],
    setupFiles: ["./test/setup.ts"],
  },
  server: {
    port: 5173,
    host: true,
  },
});
