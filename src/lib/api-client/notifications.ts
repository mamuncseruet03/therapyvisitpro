import { apiUrl, handleResponse } from "./_fetch";

// The REST endpoint always scopes to the authenticated session — any
// email argument is accepted (to match existing call sites) but ignored.
export async function getNotifications(_email?: string) {
  const res = await fetch(apiUrl("/api/v1/notifications"));
  return handleResponse(res);
}

export async function markNotificationRead(id: string) {
  const res = await fetch(apiUrl(`/api/v1/notifications/${id}/read`), { method: "POST" });
  return handleResponse(res);
}

export async function markAllNotificationsRead(_email?: string) {
  const res = await fetch(apiUrl("/api/v1/notifications/mark-all-read"), { method: "POST" });
  return handleResponse(res);
}
