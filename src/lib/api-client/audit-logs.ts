import { apiUrl, handleResponse } from "./_fetch";

export async function getAuditLogs() {
  const res = await fetch(apiUrl("/api/v1/audit-logs"));
  return handleResponse(res);
}
