import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // Browser tests in e2e/ run with Playwright (npm run test:e2e).
  test: { include: ["src/**/*.test.ts"] },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // Next.js guards server modules with this import; it has no meaning in tests.
      "server-only": fileURLToPath(new URL("./src/test/empty.ts", import.meta.url)),
    },
  },
});
