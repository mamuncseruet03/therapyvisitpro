import { apiUrl, handleResponse } from "./_fetch";

export async function getReportsData() {
  const res = await fetch(apiUrl("/api/v1/reports"));
  return handleResponse(res);
}
