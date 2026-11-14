/**
 * Stand-in for the real interaction service (source not provided in the task).
 * The controller test replaces this module with jest.mock().
 */
export const interactionService = {
  createInteraction: async (
    _data: Record<string, unknown>,
    _userId: number
  ): Promise<unknown> => {
    throw new Error("interactionService stub: not implemented");
  },
};
