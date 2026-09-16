import { apiUrl, handleResponse } from "./_fetch";

export async function getAgencies() {
  const res = await fetch(apiUrl("/api/v1/agencies"));
  return handleResponse(res);
}

export async function getAgencyById(id: string) {
  const res = await fetch(apiUrl(`/api/v1/agencies/${id}`));
  return handleResponse(res);
}

export async function createAgency(data: unknown) {
  const res = await fetch(apiUrl("/api/v1/agencies"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function updateAgency(id: string, data: unknown) {
  const res = await fetch(apiUrl(`/api/v1/agencies/${id}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function deleteAgency(id: string) {
  const res = await fetch(apiUrl(`/api/v1/agencies/${id}`), { method: "DELETE" });
  return handleResponse(res);
}
