import { NextRequest } from "next/server";
import { updateVisitNoteField } from "@/app/(app)/VisitNotes/actions";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { field, value } = await request.json();
    if (!field) return apiError("field is required", 400);
    const result = await updateVisitNoteField(id, field, value);
    return apiSuccess(result);
  } catch (err) {
    return handleApiError(err);
  }
}
