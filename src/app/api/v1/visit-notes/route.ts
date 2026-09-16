import { NextRequest } from "next/server";
import { getVisitNotes, saveVisitNote } from "@/app/(app)/VisitNotes/actions";
import { apiSuccess, handleApiError } from "@/lib/api/response";

export async function GET() {
  try {
    const notes = await getVisitNotes();
    return apiSuccess(notes);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    // Force creation — never let a client-supplied id route this into an update.
    const result = await saveVisitNote({ ...data, id: undefined });
    return apiSuccess(result, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
