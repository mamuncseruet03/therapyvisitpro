import { NextRequest } from "next/server";
import { updateUser } from "@/app/(app)/UserManagement/actions";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();
    const result = await updateUser({ id, data });
    if (result?.error) return apiError(result.error, 400);
    return apiSuccess(result);
  } catch (err) {
    return handleApiError(err);
  }
}
