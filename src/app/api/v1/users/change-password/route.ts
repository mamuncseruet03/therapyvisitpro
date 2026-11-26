import { NextRequest } from "next/server";
import { changeCurrentUserPassword } from "@/app/(app)/UserManagement/actions";
import { apiError, apiSuccess, handleApiError } from "@/lib/api/response";

export async function POST(request: NextRequest) {
  try {
    const result = await changeCurrentUserPassword(await request.json());
    if (result?.error) return apiError(result.error, 400);
    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}
