import { NextRequest } from "next/server";
import { updateReferral } from "@/components/patients/referral-actions";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await request.json();
    const result = await updateReferral(id, data);
    if (result?.error) return apiError(result.error, result.error === "Referral not found" ? 404 : 400);
    return apiSuccess(result);
  } catch (err) {
    return handleApiError(err);
  }
}
