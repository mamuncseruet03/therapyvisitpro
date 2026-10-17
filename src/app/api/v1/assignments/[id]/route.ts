import { NextRequest } from "next/server";
import { updateAssignment, deleteAssignment } from "@/components/patients/referral-actions";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();
    const result = await updateAssignment(id, data);
    if (result?.error) return apiError(result.error, 400);
    return apiSuccess(result);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await deleteAssignment(id);
    return apiSuccess(result);
  } catch (err) {
    return handleApiError(err);
  }
}
