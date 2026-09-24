import { defineConfig } from "@playwright/test";

/**
 * End-to-end checks in the Chrome already installed on this machine (no browser download).
 * Uses the running dev server on port 3310, or starts one.
 */
export default defineConfig({
  testDir: "e2e",
  timeout: 90_000,
  use: {
    baseURL: "http://localhost:3310",
    channel: "chrome",
    headless: true,
    permissions: ["microphone"],
    launchOptions: { args: ["--autoplay-policy=no-user-gesture-required"] },
  },
  webServer: {
    command: "./node_modules/.bin/next dev --port 3310",
    url: "http://localhost:3310",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
