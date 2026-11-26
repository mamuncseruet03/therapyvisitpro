import { apiUrl, handleResponse } from "./_fetch";

export async function getPayers() { return handleResponse(await fetch(apiUrl("/api/v1/payers"))); }
export async function createPayer(data: unknown) { return handleResponse(await fetch(apiUrl("/api/v1/payers"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })); }
export async function updatePayer(id: string, data: unknown) { return handleResponse(await fetch(apiUrl(`/api/v1/payers/${id}`), { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })); }
export async function deletePayer(id: string) { return handleResponse(await fetch(apiUrl(`/api/v1/payers/${id}`), { method: "DELETE" })); }
