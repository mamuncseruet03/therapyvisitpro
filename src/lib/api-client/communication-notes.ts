import { apiUrl, handleResponse } from "./_fetch";

export async function getCommunicationNotes(patientId: string) {
  const res = await fetch(apiUrl(`/api/v1/patients/${patientId}/communication-notes`));
  return handleResponse(res);
}

export async function addCommunicationNote({
  patientId,
  patientName,
  note,
  noteType,
}: {
  patientId: string;
  patientName: string;
  note: string;
  noteType: string;
}) {
  const res = await fetch(apiUrl(`/api/v1/patients/${patientId}/communication-notes`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ patientName, note, noteType }),
  });
  return handleResponse(res);
}
