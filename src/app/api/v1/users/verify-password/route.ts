import { NextRequest } from "next/server";
import { verifyCurrentUserPassword } from "@/app/(app)/UserManagement/actions";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    if (!password) return apiError("password is required", 400);
    const result = await verifyCurrentUserPassword(password);
    return apiSuccess(result);
  } catch (err) {
    return handleApiError(err);
  }
}
