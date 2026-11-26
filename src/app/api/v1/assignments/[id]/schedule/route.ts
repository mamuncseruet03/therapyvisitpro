import { NextRequest } from "next/server";
import { scheduleAssignment } from "@/components/patients/referral-actions";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const result = await scheduleAssignment(id, await request.json());
    if (result?.error) return apiError(result.error, result.error === "Assignment not found" ? 404 : 400);
    return apiSuccess(result, 201);
  } catch (err) {
    console.error("Failed to schedule assignment", err);
    return handleApiError(err);
  }
}
