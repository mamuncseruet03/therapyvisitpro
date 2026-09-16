import { NextRequest } from "next/server";
import { getTherapistById, updateTherapist, deleteTherapist } from "@/app/(app)/Therapists/actions";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const therapist = await getTherapistById(id);
    if (!therapist) return apiError("Not found", 404);
    return apiSuccess(therapist);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();
    const result = await updateTherapist(id, data);
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
    const result = await deleteTherapist(id);
    return apiSuccess(result);
  } catch (err) {
    return handleApiError(err);
  }
}
