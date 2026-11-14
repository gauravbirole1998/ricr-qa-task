import { createInteraction } from "../controllers/interaction.controller";
import { interactionService } from "../services/interaction.service";
import { AuthRequest, ApiResponse } from "../types";

// Mock the service layer: the controller is tested in isolation.
jest.mock("../services/interaction.service", () => ({
  interactionService: {
    createInteraction: jest.fn(),
  },
}));

const createInteractionMock = interactionService.createInteraction as jest.Mock;

/** Builds a fake req. `body` can be overridden per test. */
function buildReq(body: AuthRequest["body"]): AuthRequest {
  return {
    body,
    user: { id: 1, email: "agent@example.com", userType: 2 },
  };
}

/**
 * Builds a fake res. `status` returns `res` itself so the chained call
 * res.status(400).json(...) works exactly like in Express.
 */
function buildRes() {
  const res = {
    status: jest.fn(),
    json: jest.fn(),
  };
  res.status.mockReturnValue(res);
  return res as typeof res & ApiResponse;
}

const validBody = { studentId: 10, statusId: 3, remarks: "Called, interested" };

describe("createInteraction controller", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  // --- Validation failures: the service must never be reached ---

  // Test 1
  it("returns 400 when studentId is missing", async () => {
    const req = buildReq({ statusId: 3, remarks: "Called" });
    const res = buildRes();

    await createInteraction(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Student ID is required",
    });
    expect(createInteractionMock).not.toHaveBeenCalled();
  });

  // Test 2
  it("returns 400 when statusId is missing", async () => {
    const req = buildReq({ studentId: 10, remarks: "Called" });
    const res = buildRes();

    await createInteraction(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Status ID is required",
    });
    expect(createInteractionMock).not.toHaveBeenCalled();
  });

  // Test 3
  it("returns 400 when remarks is missing", async () => {
    const req = buildReq({ studentId: 10, statusId: 3 });
    const res = buildRes();

    await createInteraction(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Remarks are required",
    });
    expect(createInteractionMock).not.toHaveBeenCalled();
  });

  // --- Service outcomes ---

  // Test 4
  it("returns 201 with the created record when the service succeeds", async () => {
    const created = { id: 55, ...validBody };
    createInteractionMock.mockResolvedValue(created);
    const req = buildReq(validBody);
    const res = buildRes();

    await createInteraction(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Interaction logged",
      data: created,
    });
  });

  // Test 5
  it("returns 500 with the error message when the service throws", async () => {
    createInteractionMock.mockRejectedValue(new Error("DB exploded"));
    const req = buildReq(validBody);
    const res = buildRes();

    await createInteraction(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "DB exploded",
    });
  });

  // Test 6
  it("calls the service with (req.body, req.user.id)", async () => {
    createInteractionMock.mockResolvedValue({ id: 1 });
    const req = buildReq(validBody);
    const res = buildRes();

    await createInteraction(req, res);

    expect(createInteractionMock).toHaveBeenCalledTimes(1);
    // req.user.id is 1 in buildReq()
    expect(createInteractionMock).toHaveBeenCalledWith(req.body, 1);
  });

  // --- Extra edge cases: the spec says "missing or falsy" ---

  it.each([0, null, ""])(
    "treats falsy studentId (%p) as missing",
    async (falsy) => {
      const req = buildReq({
        studentId: falsy as unknown as number,
        statusId: 3,
        remarks: "Called",
      });
      const res = buildRes();

      await createInteraction(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Student ID is required",
      });
    }
  );

  it("reports the FIRST missing field when several are missing (studentId wins)", async () => {
    const req = buildReq({});
    const res = buildRes();

    await createInteraction(req, res);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Student ID is required",
    });
  });
});
