import { test, expect, APIRequestContext } from "@playwright/test";

/**
 * B1 - API tests for the auth endpoints (no browser).
 *
 * Paths are RELATIVE ("auth/login", no leading slash) because baseURL is
 * "http://localhost:5000/api/". A leading slash would drop the "/api" prefix.
 * See playwright.config.ts for the explanation.
 *
 * Each test creates its own unique user, so tests are independent and can run
 * in parallel without "Email already exists" collisions.
 */

const MOBILE_UA = "Mozilla/5.0 (Android 13; Mobile)";
const PASSWORD = "Passw0rd!123"; // min 6 chars per the spec

type Credentials = { userName: string; email: string; password: string };

/** Unique credentials per call (timestamp + random suffix). */
function uniqueUser(): Credentials {
  const suffix = `${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
  return {
    userName: `qa_user_${suffix}`,
    email: `qa_user_${suffix}@example.com`,
    password: PASSWORD,
  };
}

/** Registers a user and asserts the setup step itself worked. */
async function registerUser(
  request: APIRequestContext,
  user: Credentials
): Promise<void> {
  const res = await request.post("auth/register", {
    data: { ...user, userType: 1 },
  });
  expect(res.status(), "setup: register should succeed").toBe(200);
}

/**
 * Pulls the "name=value" part of the accessToken cookie out of the Set-Cookie
 * header(s) so it can be sent back as a Cookie header on later requests.
 */
function extractAccessTokenCookie(setCookieHeaders: string[]): string {
  const line = setCookieHeaders.find((h) => /^accessToken=/i.test(h.trim()));
  expect(line, "response should set an accessToken cookie").toBeDefined();
  // "accessToken=abc; Path=/; HttpOnly" -> "accessToken=abc"
  return line!.split(";")[0].trim();
}

/** Returns every Set-Cookie header (a response can have several). */
function getSetCookieHeaders(res: {
  headersArray(): { name: string; value: string }[];
}): string[] {
  return res
    .headersArray()
    .filter((h) => h.name.toLowerCase() === "set-cookie")
    .map((h) => h.value);
}

test.describe("POST /auth/register", () => {
  // Test 1
  test("registers a new user successfully", async ({ request }) => {
    const user = uniqueUser();

    const res = await request.post("auth/register", {
      data: { ...user, userType: 1 },
    });
    const body = await res.json();

    expect(res.status()).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.email).toBe(user.email);
  });

  // Test 2
  test("fails validation when the email field is missing", async ({
    request,
  }) => {
    const { userName, password } = uniqueUser();

    // email intentionally omitted
    const res = await request.post("auth/register", {
      data: { userName, password, userType: 1 },
    });
    const body = await res.json();

    expect(res.status()).toBe(400);
    expect(body.success).toBe(false);
  });
});

test.describe("POST /auth/login", () => {
  // Test 3
  test("web client: sets the accessToken cookie", async ({ request }) => {
    const user = uniqueUser();
    await registerUser(request, user);

    const res = await request.post("auth/login", {
      data: { email: user.email, password: user.password },
    });

    expect(res.status()).toBe(200);
    const cookies = getSetCookieHeaders(res);
    expect(cookies.some((c) => c.startsWith("accessToken="))).toBe(true);
  });

  // Test 4
  test("mobile client: returns the token in the response body", async ({
    request,
  }) => {
    const user = uniqueUser();
    await registerUser(request, user);

    const res = await request.post("auth/login", {
      headers: { "User-Agent": MOBILE_UA },
      data: { email: user.email, password: user.password },
    });
    const body = await res.json();

    expect(res.status()).toBe(200);
    expect(typeof body.data.accessToken).toBe("string");
    expect(body.data.accessToken.length).toBeGreaterThan(0);
  });

  // Test 5
  test("rejects a wrong password with 401", async ({ request }) => {
    const user = uniqueUser();
    await registerUser(request, user);

    const res = await request.post("auth/login", {
      data: { email: user.email, password: "definitely-wrong-password" },
    });
    const body = await res.json();

    expect(res.status()).toBe(401);
    expect(body.success).toBe(false);
  });
});

test.describe("GET /auth/me", () => {
  // Test 6
  test("returns 401 when no token is sent", async ({ request }) => {
    // The `request` fixture is fresh per test, so it carries no cookies.
    const res = await request.get("auth/me");

    expect(res.status()).toBe(401);
  });

  // Test 7
  test("returns the current user when a valid cookie is sent", async ({
    request,
  }) => {
    const user = uniqueUser();
    await registerUser(request, user);

    const loginRes = await request.post("auth/login", {
      data: { email: user.email, password: user.password },
    });
    expect(loginRes.status()).toBe(200);

    // Extract the token cookie and send it explicitly, as the task describes.
    const cookie = extractAccessTokenCookie(getSetCookieHeaders(loginRes));

    const meRes = await request.get("auth/me", { headers: { Cookie: cookie } });
    const body = await meRes.json();

    expect(meRes.status()).toBe(200);
    expect(typeof body.data.id).toBe("number");
  });
});

test.describe("POST /auth/logout", () => {
  // Test 8
  test("clears the accessToken cookie", async ({ request }) => {
    const user = uniqueUser();
    await registerUser(request, user);

    const loginRes = await request.post("auth/login", {
      data: { email: user.email, password: user.password },
    });
    const cookie = extractAccessTokenCookie(getSetCookieHeaders(loginRes));

    const logoutRes = await request.post("auth/logout", {
      headers: { Cookie: cookie },
    });
    const body = await logoutRes.json();

    expect(logoutRes.status()).toBe(200);
    expect(body.success).toBe(true);

    // A cleared cookie is sent back as: empty value, OR Max-Age=0,
    // OR an Expires date in the past (Express res.clearCookie uses
    // "accessToken=; Expires=Thu, 01 Jan 1970 ...").
    const cleared = getSetCookieHeaders(logoutRes).find((c) =>
      c.startsWith("accessToken=")
    );
    expect(cleared, "logout should send a Set-Cookie for accessToken").toBeDefined();
    expect(cleared).toMatch(
      /^accessToken=(;|$)|max-age=0|expires=thu, 01 jan 1970/i
    );
  });
});
