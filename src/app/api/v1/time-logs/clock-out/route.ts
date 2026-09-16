import { NextRequest } from "next/server";
import { clockOut } from "@/app/(app)/MyLabor/actions";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";

export async function POST(request: NextRequest) {
  try {
    const { logId } = await request.json();
    if (!logId) return apiError("logId is required", 400);
    const result = await clockOut(logId);
    return apiSuccess(result);
  } catch (err) {
    return handleApiError(err);
  }
}
