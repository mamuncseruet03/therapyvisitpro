import { apiUrl, handleResponse } from "./_fetch";

export async function getTherapists() {
  const res = await fetch(apiUrl("/api/v1/therapists"));
  return handleResponse(res);
}

export async function getMyTherapistProfile(therapistId?: string | null) {
  const query = therapistId ? `?therapistId=${encodeURIComponent(therapistId)}` : "";
  const res = await fetch(apiUrl(`/api/v1/therapists/me${query}`));
  return handleResponse(res);
}

export async function updateMyTherapistProfile(therapistId: string | null | undefined, data: unknown) {
  const query = therapistId ? `?therapistId=${encodeURIComponent(therapistId)}` : "";
  const res = await fetch(apiUrl(`/api/v1/therapists/me${query}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function getTherapistById(id: string) {
  const res = await fetch(apiUrl(`/api/v1/therapists/${id}`));
  return handleResponse(res);
}

export async function createTherapist(data: unknown) {
  const res = await fetch(apiUrl("/api/v1/therapists"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function updateTherapist(id: string, data: unknown) {
  const res = await fetch(apiUrl(`/api/v1/therapists/${id}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function deleteTherapist(id: string) {
  const res = await fetch(apiUrl(`/api/v1/therapists/${id}`), { method: "DELETE" });
  return handleResponse(res);
}
