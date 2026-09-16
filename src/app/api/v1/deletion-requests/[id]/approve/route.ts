import { NextRequest } from "next/server";
import { approveDeletionRequest } from "@/app/(app)/Orders/actions";
import { apiSuccess, handleApiError } from "@/lib/api/response";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await approveDeletionRequest(id);
    return apiSuccess(result);
  } catch (err) {
    return handleApiError(err);
  }
}
