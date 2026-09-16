import { apiUrl, handleResponse } from "./_fetch";

// The REST endpoint always scopes to the authenticated session — any
// email argument is accepted (to match existing call sites) but ignored.
export async function getTimeLogs(_email?: string) {
  const res = await fetch(apiUrl("/api/v1/time-logs/mine"));
  return handleResponse(res);
}

// id/name/email are accepted (to match existing call sites) but ignored —
// clock-in always uses the authenticated session's identity server-side.
export async function clockIn(_id?: string, _name?: string, _email?: string) {
  const res = await fetch(apiUrl("/api/v1/time-logs/clock-in"), { method: "POST" });
  return handleResponse(res);
}

export async function clockOut(logId: string) {
  const res = await fetch(apiUrl("/api/v1/time-logs/clock-out"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ logId }),
  });
  return handleResponse(res);
}
