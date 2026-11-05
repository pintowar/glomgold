import { defineConfig, devices } from "@playwright/test";
import { test as baseTest } from "playwright-test-coverage";

const test = baseTest;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [
    ["list"],
    ["html", { open: "never" }],
    process.env.VITE_COVERAGE && ["json", { outputFile: "coverage/playwright-coverage.json" }],
  ].filter(Boolean),
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // The whole API is stubbed per test, so only the Vite dev server is needed.
    command: "npm run dev",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
