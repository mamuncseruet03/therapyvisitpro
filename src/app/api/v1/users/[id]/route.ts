import { NextRequest } from "next/server";
import { deleteUser, updateUser } from "@/app/(app)/UserManagement/actions";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();
    const result = await updateUser({ id, data });
    if (result?.error) return apiError(result.error, result.status ?? 400);
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
    const result = await deleteUser(id);
    if (result?.error) return apiError(result.error, result.error === "User not found" ? 404 : 400);
    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}
