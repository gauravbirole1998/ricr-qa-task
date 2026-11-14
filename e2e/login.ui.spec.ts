import { test, expect } from "@playwright/test";

/**
 * B2 - UI end-to-end tests for the login page (frontend at http://localhost:5173).
 *
 * Valid credentials come from environment variables so no secrets live in the
 * repo:   TEST_USER_EMAIL=...  TEST_USER_PASSWORD=...  npx playwright test
 * The defaults below are placeholders for a user that exists in the test DB.
 */
const VALID_EMAIL = process.env.TEST_USER_EMAIL ?? "qa.user@example.com";
const VALID_PASSWORD = process.env.TEST_USER_PASSWORD ?? "Passw0rd!123";

test.describe("Login page (raw locators)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  // The spec allows placeholder OR name, so each locator accepts either.
  const emailInput = (page: import("@playwright/test").Page) =>
    page.locator('input[placeholder="Email"], input[name="email"]');
  const passwordInput = (page: import("@playwright/test").Page) =>
    page.locator(
      'input[type="password"][placeholder="Password"], input[type="password"][name="password"]'
    );
  // Button text may be "Login" or "Sign In" (case-insensitive).
  const loginButton = (page: import("@playwright/test").Page) =>
    page.getByRole("button", { name: /^(login|sign in)$/i });

  // Test 1
  test("page loads with email, password and login button visible", async ({
    page,
  }) => {
    await expect(emailInput(page)).toBeVisible();
    await expect(passwordInput(page)).toBeVisible();
    await expect(loginButton(page)).toBeVisible();
  });

  // Test 2
  test("successful login redirects to /dashboard", async ({ page }) => {
    await emailInput(page).fill(VALID_EMAIL);
    await passwordInput(page).fill(VALID_PASSWORD);
    await loginButton(page).click();

    await expect(page).toHaveURL(/\/dashboard/);
  });

  // Test 3
  test("wrong password shows an error message", async ({ page }) => {
    await emailInput(page).fill(VALID_EMAIL);
    await passwordInput(page).fill("wrong-password-123");
    await loginButton(page).click();

    // Spec: message contains "Invalid credentials" or "incorrect".
    await expect(page.getByText(/invalid credentials|incorrect/i)).toBeVisible();
    await expect(page).not.toHaveURL(/\/dashboard/);
  });

  // Test 4
  test("empty form submission does not navigate to /dashboard", async ({
    page,
  }) => {
    await loginButton(page).click();

    // Works whether the app shows a validation message or the browser's
    // native "required" tooltip blocks the submit: either way, no redirect.
    await expect(page).not.toHaveURL(/\/dashboard/);
    await expect(emailInput(page)).toBeVisible(); // still on the login form
  });

  // Test 5
  test("shows a loading state while the request is in flight", async ({
    page,
  }) => {
    // Hold the login request for 1.5s so the in-flight state can be observed
    // reliably (a fast local API would otherwise finish before we look).
    await page.route("**/api/auth/login", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await route.continue();
    });

    await emailInput(page).fill(VALID_EMAIL);
    await passwordInput(page).fill(VALID_PASSWORD);
    await loginButton(page).click();

    // While loading, the button's label may change (e.g. "Logging in..."), so
    // locate it by type/text rather than by the exact name used above.
    const submitButton = page
      .locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")')
      .first();
    const spinner = page.locator(
      '[role="progressbar"], [aria-busy="true"], .spinner, .loading, .loader'
    );

    // Spec: button disabled OR a loading indicator visible.
    await expect(async () => {
      const disabled = await submitButton.isDisabled();
      const spinning = await spinner.first().isVisible().catch(() => false);
      expect(disabled || spinning).toBe(true);
    }).toPass({ timeout: 1400 });
  });
});
