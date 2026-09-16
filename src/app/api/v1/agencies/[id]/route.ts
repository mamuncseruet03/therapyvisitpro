import { NextRequest } from "next/server";
import { getAgencyById, updateAgency, deleteAgency } from "@/app/(app)/Agencies/actions";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const agency = await getAgencyById(id);
    if (!agency) return apiError("Not found", 404);
    return apiSuccess(agency);
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
    const result = await updateAgency(id, data);
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
    const result = await deleteAgency(id);
    return apiSuccess(result);
  } catch (err) {
    return handleApiError(err);
  }
}
