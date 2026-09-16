import { NextRequest } from "next/server";
import { getVisitNoteById, saveVisitNote, deleteVisitNote } from "@/app/(app)/VisitNotes/actions";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const note = await getVisitNoteById(id);
    if (!note) return apiError("Not found", 404);
    return apiSuccess(note);
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
    const result = await saveVisitNote({ ...data, id });
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
    const result = await deleteVisitNote(id);
    return apiSuccess(result);
  } catch (err) {
    return handleApiError(err);
  }
}
