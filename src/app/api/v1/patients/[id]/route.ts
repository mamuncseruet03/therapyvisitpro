import { NextRequest } from "next/server";
import { getPatientById, updatePatient, deletePatient } from "@/app/(app)/Patients/actions";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const patient = await getPatientById(id);
    if (!patient) return apiError("Not found", 404);
    return apiSuccess(patient);
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
    const result = await updatePatient(id, data);
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
    const result = await deletePatient(id);
    return apiSuccess(result);
  } catch (err) {
    return handleApiError(err);
  }
}
