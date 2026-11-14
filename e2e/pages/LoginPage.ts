import { expect, Locator, Page } from "@playwright/test";

/**
 * Page Object for the login page ("/" on http://localhost:5173).
 *
 * Design rules used here:
 *  - ALL selectors live in this class; specs never call page.locator().
 *  - Locators are exposed as readonly properties so specs can write their own
 *    expect(...) assertions on them (keeps "what is checked" visible in the test).
 *  - Actions (fill/click) and multi-step flows live in methods.
 *  - Assertions about the page URL / in-flight state are wrapped in methods so
 *    specs don't need to touch `page` directly.
 */
export class LoginPage {
  readonly page: Page;

  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;

  // Used only for the loading-state check: the label can change while loading
  // (e.g. "Logging in..."), so this locator does not depend on the button text.
  private readonly submitButton: Locator;
  private readonly spinner: Locator;

  constructor(page: Page) {
    this.page = page;

    this.emailInput = page.locator(
      'input[placeholder="Email"], input[name="email"]'
    );
    this.passwordInput = page.locator(
      'input[type="password"][placeholder="Password"], input[type="password"][name="password"]'
    );
    this.loginButton = page.getByRole("button", { name: /^(login|sign in)$/i });
    this.errorMessage = page.getByText(/invalid credentials|incorrect/i);

    this.submitButton = page
      .locator(
        'button[type="submit"], button:has-text("Login"), button:has-text("Sign In")'
      )
      .first();
    this.spinner = page.locator(
      '[role="progressbar"], [aria-busy="true"], .spinner, .loading, .loader'
    );
  }

  // ---------- Navigation ----------

  async goto(): Promise<void> {
    await this.page.goto("/");
  }

  // ---------- Actions ----------

  async fillEmail(email: string): Promise<void> {
    await this.emailInput.fill(email);
  }

  async fillPassword(password: string): Promise<void> {
    await this.passwordInput.fill(password);
  }

  async clickLogin(): Promise<void> {
    await this.loginButton.click();
  }

  /** Fill both fields and submit. */
  async login(email: string, password: string): Promise<void> {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.clickLogin();
  }

  /**
   * Delays the login API response so the in-flight (loading) state can be
   * observed reliably. Call this BEFORE submitting the form.
   */
  async delayLoginRequest(ms: number): Promise<void> {
    await this.page.route("**/api/auth/login", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, ms));
      await route.continue();
    });
  }

  // ---------- Assertions wrapped as methods ----------

  async expectRedirectedToDashboard(): Promise<void> {
    await expect(this.page).toHaveURL(/\/dashboard/);
  }

  async expectNotOnDashboard(): Promise<void> {
    await expect(this.page).not.toHaveURL(/\/dashboard/);
  }

  /** Passes when the button is disabled OR a loading indicator is visible. */
  async expectLoadingState(timeoutMs = 1400): Promise<void> {
    await expect(async () => {
      const disabled = await this.submitButton.isDisabled();
      const spinning = await this.spinner
        .first()
        .isVisible()
        .catch(() => false);
      expect(disabled || spinning).toBe(true);
    }).toPass({ timeout: timeoutMs });
  }
}
