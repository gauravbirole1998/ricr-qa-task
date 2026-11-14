import { prisma, CallerRecord } from "../lib/prisma";

/**
 * Reference implementation written from the spec in the task document.
 * (The real source is not provided; the tests are written against the spec.)
 */
async function getCallerById(callerId: number): Promise<CallerRecord> {
  const caller = await prisma.caller.findUnique({ where: { id: callerId } });

  if (!caller) {
    throw new Error("Caller not found");
  }

  return caller;
}

export const callerService = { getCallerById };
