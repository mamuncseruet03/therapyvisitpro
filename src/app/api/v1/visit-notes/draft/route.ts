import { NextRequest } from "next/server";
import { getLatestDraftVisitNote } from "@/app/(app)/VisitNotes/actions";
import { apiSuccess, handleApiError } from "@/lib/api/response";

export async function GET(request: NextRequest) {
  try {
    const draft = await getLatestDraftVisitNote({
      patientId: request.nextUrl.searchParams.get("patientId"),
      therapistId: request.nextUrl.searchParams.get("therapistId"),
      visitType: request.nextUrl.searchParams.get("visitType"),
    });
    return apiSuccess(draft);
  } catch (error) {
    return handleApiError(error);
  }
}
