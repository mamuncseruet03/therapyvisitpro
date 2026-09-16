import { NextRequest } from "next/server";
import { getAssignments, createAssignment } from "@/components/patients/referral-actions";
import { apiSuccess, handleApiError } from "@/lib/api/response";

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
    return apiSuccess(result, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
