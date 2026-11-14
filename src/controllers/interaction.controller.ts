import { interactionService } from "../services/interaction.service";
import { AuthRequest, ApiResponse } from "../types";

/**
 * Reference implementation written from the spec in the task document.
 * POST /api/interactions
 */
export async function createInteraction(
  req: AuthRequest,
  res: ApiResponse
): Promise<void> {
  const { studentId, statusId, remarks } = req.body;

  if (!studentId) {
    res.status(400).json({ success: false, message: "Student ID is required" });
    return;
  }
  if (!statusId) {
    res.status(400).json({ success: false, message: "Status ID is required" });
    return;
  }
  if (!remarks) {
    res.status(400).json({ success: false, message: "Remarks are required" });
    return;
  }

  try {
    const result = await interactionService.createInteraction(
      req.body,
      req.user.id
    );
    res
      .status(201)
      .json({ success: true, message: "Interaction logged", data: result });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    res.status(500).json({ success: false, message });
  }
}
