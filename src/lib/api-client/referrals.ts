import { apiUrl, handleResponse } from "./_fetch";

export async function getReferrals() {
  const res = await fetch(apiUrl("/api/v1/referrals"));
  return handleResponse(res);
}

export async function createReferral(data: unknown) {
  const res = await fetch(apiUrl("/api/v1/referrals"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function getAssignments() {
  const res = await fetch(apiUrl("/api/v1/assignments"));
  return handleResponse(res);
}

export async function createAssignment(data: unknown) {
  const res = await fetch(apiUrl("/api/v1/assignments"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function updateAssignment(id: string, data: unknown) {
  const res = await fetch(apiUrl(`/api/v1/assignments/${id}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function deleteAssignment(id: string) {
  const res = await fetch(apiUrl(`/api/v1/assignments/${id}`), { method: "DELETE" });
  return handleResponse(res);
}
