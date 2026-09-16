import { NextRequest } from "next/server";
import { getCommunicationNotes, addCommunicationNote } from "@/components/patients/communication-actions";
import { apiSuccess, handleApiError } from "@/lib/api/response";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const notes = await getCommunicationNotes(id);
    return apiSuccess(notes);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { patientName, note, noteType } = await request.json();
    const result = await addCommunicationNote({ patientId: id, patientName, note, noteType });
    return apiSuccess(result, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
