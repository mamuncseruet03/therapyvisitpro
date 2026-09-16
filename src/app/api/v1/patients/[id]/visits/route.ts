import { NextRequest } from "next/server";
import { getPatientVisits } from "@/app/(app)/VisitNotes/actions";
import { apiSuccess, handleApiError } from "@/lib/api/response";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const visits = await getPatientVisits(id);
    return apiSuccess(visits);
  } catch (err) {
    return handleApiError(err);
  }
}
