import { apiUrl, handleResponse } from "./_fetch";

export async function getDocuments() {
  const res = await fetch(apiUrl("/api/v1/documents"));
  return handleResponse(res);
}

export async function createDocument(data: unknown) {
  const res = await fetch(apiUrl("/api/v1/documents"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function updateDocument(id: string, data: unknown) {
  const res = await fetch(apiUrl(`/api/v1/documents/${id}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function deleteDocument(id: string) {
  const res = await fetch(apiUrl(`/api/v1/documents/${id}`), { method: "DELETE" });
  return handleResponse(res);
}
