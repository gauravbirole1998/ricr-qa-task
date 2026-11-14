import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";

/**
 * B3 - the same 5 tests as login.ui.spec.ts, rewritten with the Page Object Model.
 * Test bodies only use LoginPage members: no page.locator() calls here.
 */
const VALID_EMAIL = process.env.TEST_USER_EMAIL ?? "qa.user@example.com";
const VALID_PASSWORD = process.env.TEST_USER_PASSWORD ?? "Passw0rd!123";

test.describe("Login page (Page Object Model)", () => {
  // Test 1
  test("page loads with email, password and login button visible", async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.loginButton).toBeVisible();
  });

  // Test 2
  test("successful login redirects to /dashboard", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.login(VALID_EMAIL, VALID_PASSWORD);

    await loginPage.expectRedirectedToDashboard();
  });

  // Test 3
  test("wrong password shows an error message", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.login(VALID_EMAIL, "wrong-password-123");

    await expect(loginPage.errorMessage).toBeVisible();
    await loginPage.expectNotOnDashboard();
  });

  // Test 4
  test("empty form submission does not navigate to /dashboard", async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.clickLogin();

    await loginPage.expectNotOnDashboard();
    await expect(loginPage.emailInput).toBeVisible();
  });

  // Test 5
  test("shows a loading state while the request is in flight", async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.delayLoginRequest(1500);

    await loginPage.login(VALID_EMAIL, VALID_PASSWORD);

    await loginPage.expectLoadingState();
  });
});
