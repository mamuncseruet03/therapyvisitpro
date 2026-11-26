import { NextRequest } from "next/server";
import { approveDeletionRequest } from "@/app/(app)/Orders/actions";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await approveDeletionRequest(id, (await request.json()).password);
    if (result.error) return apiError(result.error, 400);
    return apiSuccess(result);
  } catch (err) {
    return handleApiError(err);
  }
}
