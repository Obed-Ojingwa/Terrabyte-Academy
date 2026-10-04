import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.E2E_STAGING_BASE_URL || "http://127.0.0.1:3010";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    ...devices["Desktop Chrome"],
    baseURL,
    trace: "retain-on-failure",
    launchOptions: process.env.E2E_CHROMIUM_PATH
      ? { executablePath: process.env.E2E_CHROMIUM_PATH }
      : undefined,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: process.env.E2E_STAGING_BASE_URL ? undefined : [
    {
      command: "node e2e/mock-api-server.mjs",
      url: "http://127.0.0.1:8000/api/v1/health",
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
    {
      command: "npm run dev -- --hostname 127.0.0.1 --port 3010",
      url: baseURL,
      env: { NEXT_PUBLIC_API_URL: "http://127.0.0.1:8000/api/v1" },
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
