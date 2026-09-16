import { apiUrl, handleResponse } from "./_fetch";

export async function getCompanyInfo() {
  const res = await fetch(apiUrl("/api/v1/company-info"));
  if (res.status === 404) return null;
  return handleResponse(res);
}

export async function saveCompanyInfo(data: unknown) {
  const res = await fetch(apiUrl("/api/v1/company-info"), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function saveMenuPermissions(permissions: unknown) {
  const res = await fetch(apiUrl("/api/v1/company-info/menu-permissions"), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(permissions),
  });
  return handleResponse(res);
}
