import { apiUrl, handleResponse } from "./_fetch";

export async function getUsers() {
  const res = await fetch(apiUrl("/api/v1/users"));
  return handleResponse(res);
}

export async function inviteUser(data: unknown) {
  const res = await fetch(apiUrl("/api/v1/users"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function updateUser({ id, data }: { id: string; data: unknown }) {
  const res = await fetch(apiUrl(`/api/v1/users/${id}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function syncTherapistsToUsers() {
  const res = await fetch(apiUrl("/api/v1/users/sync-therapists"), { method: "POST" });
  return handleResponse(res);
}

export async function verifyCurrentUserPassword(password: string) {
  const res = await fetch(apiUrl("/api/v1/users/verify-password"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  return handleResponse(res);
}
