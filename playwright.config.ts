import { defineConfig, devices } from "@playwright/test";

/**
 * Two projects are used because the task has two different base URLs:
 *  - "api": REST API at http://localhost:5000/api   (Section B1)
 *  - "ui" : React frontend at http://localhost:5173 (Sections B2 + B3)
 *
 * NOTE on the API baseURL: it ends with a trailing slash ("/api/") on purpose.
 * Playwright resolves paths with `new URL(path, baseURL)`. Without the trailing
 * slash, a relative path like "auth/login" would resolve to
 * http://localhost:5000/auth/login (dropping "/api"). With it, the API specs
 * can call `request.post("auth/login")` and correctly hit /api/auth/login.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "api",
      testMatch: /.*\.api\.spec\.ts/,
      use: {
        baseURL: "http://localhost:5000/api/",
      },
    },
    {
      name: "ui",
      testMatch: /.*\.(ui|pom)\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: "http://localhost:5173",
      },
    },
  ],
});
