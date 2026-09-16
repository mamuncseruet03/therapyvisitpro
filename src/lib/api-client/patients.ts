import { apiUrl, handleResponse } from "./_fetch";

export async function getPatients() {
  const res = await fetch(apiUrl("/api/v1/patients"));
  return handleResponse(res);
}

export async function getPatientById(id: string) {
  const res = await fetch(apiUrl(`/api/v1/patients/${id}`));
  return handleResponse(res);
}

export async function createPatient(data: unknown) {
  const res = await fetch(apiUrl("/api/v1/patients"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function updatePatient(id: string, data: unknown) {
  const res = await fetch(apiUrl(`/api/v1/patients/${id}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function deletePatient(id: string) {
  const res = await fetch(apiUrl(`/api/v1/patients/${id}`), { method: "DELETE" });
  return handleResponse(res);
}

export async function getAgenciesForSelect() {
  const res = await fetch(apiUrl("/api/v1/patients/agencies-for-select"));
  return handleResponse(res);
}
