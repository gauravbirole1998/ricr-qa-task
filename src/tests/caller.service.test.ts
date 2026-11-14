import { callerService } from "../services/caller.service";
import { prisma, CallerRecord } from "../lib/prisma";

// Replace the real database client with an auto-mock so no DB is ever touched.
// jest.mock is hoisted above the imports by ts-jest/babel-plugin-jest-hoist.
jest.mock("../lib/prisma", () => ({
  prisma: {
    caller: {
      findUnique: jest.fn(),
    },
  },
}));

// Typed handle on the mocked function so we get autocomplete + type safety.
const findUniqueMock = prisma.caller.findUnique as jest.Mock;

const fakeCaller: CallerRecord = {
  id: 7,
  name: "Aman Verma",
  email: "aman@example.com",
  phone: "9876543210",
  roleId: 2,
  isActive: true,
  createdAt: new Date("2026-01-15T10:00:00.000Z"),
};

describe("callerService.getCallerById", () => {
  // Reset call history + programmed return values so tests stay independent.
  beforeEach(() => {
    jest.resetAllMocks();
  });

  // Test 1 - happy path
  it("returns the caller when findUnique resolves with a record", async () => {
    findUniqueMock.mockResolvedValue(fakeCaller);

    const result = await callerService.getCallerById(7);

    // toBe -> same reference: the service must return the record "as-is".
    expect(result).toBe(fakeCaller);
  });

  // Test 2 - not found
  it('throws Error("Caller not found") when findUnique resolves with null', async () => {
    findUniqueMock.mockResolvedValue(null);

    await expect(callerService.getCallerById(999)).rejects.toThrow(
      "Caller not found"
    );
    // Also make sure it is a real Error object, not just a string.
    await expect(callerService.getCallerById(999)).rejects.toBeInstanceOf(Error);
  });

  // Test 3 - correct query argument
  it("calls findUnique with { where: { id: callerId } }", async () => {
    findUniqueMock.mockResolvedValue(fakeCaller);

    await callerService.getCallerById(42);

    expect(findUniqueMock).toHaveBeenCalledTimes(1);
    expect(findUniqueMock).toHaveBeenCalledWith({ where: { id: 42 } });
  });

  // Test 4 - DB error propagates
  it("propagates the database error instead of swallowing it", async () => {
    const dbError = new Error("DB connection lost");
    findUniqueMock.mockRejectedValue(dbError);

    await expect(callerService.getCallerById(7)).rejects.toThrow(
      "DB connection lost"
    );
    // Same error instance -> the service did not wrap or replace it.
    await expect(callerService.getCallerById(7)).rejects.toBe(dbError);
  });
});
