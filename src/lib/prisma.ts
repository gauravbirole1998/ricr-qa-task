/**
 * Stand-in for the real Prisma client.
 *
 * The task does not give us the application source code, so we only declare the
 * tiny slice of the Prisma API that callerService uses. In the unit tests this
 * whole module is replaced with jest.mock(), so none of this code ever runs.
 */
export type CallerRecord = {
  id: number;
  name: string;
  email: string;
  phone: string;
  roleId: number;
  isActive: boolean;
  createdAt: Date;
};

export const prisma = {
  caller: {
    findUnique: async (_args: {
      where: { id: number };
    }): Promise<CallerRecord | null> => {
      throw new Error("prisma stub: not connected to a real database");
    },
  },
};
