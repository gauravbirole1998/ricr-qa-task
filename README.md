# RICR Dashboard - Tester Evaluation Task

Solution for the QA / Test Engineer evaluation: **Jest unit tests** (Section A) and **Playwright API + UI tests** (Section B).

## Project structure

```
src/
  utils/pagination.util.ts          A1  getPaginationMeta implementation
  services/caller.service.ts        A2  reference implementation from the spec
  services/interaction.service.ts   A3  stub (mocked in tests)
  controllers/interaction.controller.ts  A3  reference implementation from the spec
  lib/prisma.ts                     A2  tiny Prisma stub (mocked in tests)
  types/index.ts                    A3  minimal req/res types (no Express needed)
  tests/
    pagination.util.test.ts         A1  10 tests
    caller.service.test.ts          A2  4 tests
    interaction.controller.test.ts  A3  10 tests
e2e/
  auth.api.spec.ts                  B1  8 API tests
  login.ui.spec.ts                  B2  5 UI tests (raw locators)
  pages/LoginPage.ts                B3  Page Object
  login.pom.spec.ts                 B3  same 5 tests using LoginPage
playwright.config.ts
jest.config.js
```

## Setup

```bash
npm install
npx playwright install chromium   # only needed to actually run the UI tests
```

## Running

| Command | What it runs |
| --- | --- |
| `npm test` | Jest unit tests (Section A) |
| `npm run test:api` | Playwright API tests (needs the API on `localhost:5000`) |
| `npm run test:ui` | Playwright UI tests (needs the frontend on `localhost:5173`) |
| `npm run typecheck` | TypeScript check of all source and tests |

UI tests read valid credentials from environment variables:

```bash
TEST_USER_EMAIL=you@example.com TEST_USER_PASSWORD=secret npm run test:ui
```

## Status

- **Section A (Jest):** all 24 tests pass (`npm test`).
- **Section B (Playwright):** code-reviewed only, as stated in the task (no live server provided). The project type-checks and Playwright discovers all 18 tests (`npx playwright test --list`).

## Key decisions

- **Implementations vs. tests.** The task gives no source code, so the small functions under test (`getCallerById`, `createInteraction`) were written strictly from the specs. The tests target the *spec*, so they would also work against the real code.
- **Mocking.** `prisma` and `interactionService` are replaced with `jest.mock()`, so unit tests never touch a database. `jest.resetAllMocks()` in `beforeEach` keeps tests independent.
- **Jest vs. Playwright.** `jest.config.js` sets `roots: ["<rootDir>/src"]` so Jest doesn't try to run the Playwright specs in `e2e/`.
- **Two Playwright projects** (`api` and `ui`) because the API (`:5000/api`) and frontend (`:5173`) have different base URLs.
- **API `baseURL` has a trailing slash** (`http://localhost:5000/api/`) and API calls use relative paths such as `auth/login`. In Playwright, a path with a leading slash (`/auth/login`) would drop `/api` from the URL.
- **Test independence.** Each API test registers its own unique user (timestamp + random suffix), so tests can run in parallel and re-run without "Email already exists" errors.
- **Cookies.** The login cookie is extracted from the `Set-Cookie` header and sent explicitly on later requests, matching the task description.
- **Logout check.** A cleared cookie is accepted as an empty value, `Max-Age=0`, or an `Expires` date in 1970.
- **Loading-state test.** The login request is delayed with `page.route()` so the in-flight state can be observed reliably instead of racing a fast local API.
- **Page Object.** Locators live only in `LoginPage`; specs use its locators/methods and never call `page.locator()`.

## Extra tests beyond the required scenarios

- Pagination: exact multiple of limit, `limit = 0` / negative throws `RangeError`, full return shape.
- Controller: falsy values (`0`, `null`, `""`) treated as missing, and which error wins when several fields are missing.
- Service: the same error instance propagates (not wrapped).
