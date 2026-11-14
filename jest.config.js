module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  // Only pick up unit tests under src/. Without this, Jest would also try to
  // run the Playwright specs in e2e/ (which use a different test runner).
  roots: ["<rootDir>/src"],
};
