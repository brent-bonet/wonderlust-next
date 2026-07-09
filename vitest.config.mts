import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
    alias: {
      // server-only throws outside a React Server context; tests import
      // server modules directly, so stub it out.
      "server-only": new URL("./__tests__/stubs/empty.ts", import.meta.url)
        .pathname,
    },
  },
  test: {
    environment: "jsdom",
  },
});
