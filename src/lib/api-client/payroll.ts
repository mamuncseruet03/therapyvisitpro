import { apiUrl, handleResponse } from "./_fetch";

export async function getPayrollData() {
  const res = await fetch(apiUrl("/api/v1/payroll"));
  return handleResponse(res);
}
