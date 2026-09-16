import { apiUrl, handleResponse } from "./_fetch";

export async function getVisitNotes() {
  const res = await fetch(apiUrl("/api/v1/visit-notes"));
  return handleResponse(res);
}

export async function getVisitNoteById(id: string) {
  const res = await fetch(apiUrl(`/api/v1/visit-notes/${id}`));
  return handleResponse(res);
}

// Mirrors the original saveVisitNote()'s create-or-update semantics:
// POST when there's no id yet, PATCH (create-or-update via the [id] route)
// once one exists.
export async function saveVisitNote(data: { id?: string; [key: string]: unknown }) {
  const { id, ...rest } = data;
  if (!id) {
    const res = await fetch(apiUrl("/api/v1/visit-notes"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rest),
    });
    return handleResponse(res);
  }
  const res = await fetch(apiUrl(`/api/v1/visit-notes/${id}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(rest),
  });
  return handleResponse(res);
}

export async function updateVisitNoteField(id: string, field: string, value: unknown) {
  const res = await fetch(apiUrl(`/api/v1/visit-notes/${id}/field`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ field, value }),
  });
  return handleResponse(res);
}

export async function deleteVisitNote(id: string) {
  const res = await fetch(apiUrl(`/api/v1/visit-notes/${id}`), { method: "DELETE" });
  return handleResponse(res);
}

export async function getPatientVisits(patientId: string) {
  const res = await fetch(apiUrl(`/api/v1/patients/${patientId}/visits`));
  return handleResponse(res);
}

export async function getVisitFormData() {
  const res = await fetch(apiUrl("/api/v1/visit-notes/form-data"));
  return handleResponse(res);
}
