import { NextRequest } from "next/server";
import { getAssignments, createAssignment } from "@/components/patients/referral-actions";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";

export async function GET() {
  try {
    const assignments = await getAssignments();
    return apiSuccess(assignments);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const result = await createAssignment(data);
    if (result?.error) return apiError(result.error, 400);
    return apiSuccess(result, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
