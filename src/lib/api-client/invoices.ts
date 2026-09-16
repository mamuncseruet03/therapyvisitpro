import { apiUrl, handleResponse } from "./_fetch";

export async function getInvoices() {
  const res = await fetch(apiUrl("/api/v1/invoices"));
  return handleResponse(res);
}

export async function createInvoice(data: unknown) {
  const res = await fetch(apiUrl("/api/v1/invoices"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function updateInvoice(id: string, data: unknown) {
  const res = await fetch(apiUrl(`/api/v1/invoices/${id}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function deleteInvoice(id: string) {
  const res = await fetch(apiUrl(`/api/v1/invoices/${id}`), { method: "DELETE" });
  return handleResponse(res);
}

export async function getAgenciesForInvoice() {
  const res = await fetch(apiUrl("/api/v1/invoices/agencies"));
  return handleResponse(res);
}

export async function getCompletedVisitsForInvoice() {
  const res = await fetch(apiUrl("/api/v1/invoices/completed-visits"));
  return handleResponse(res);
}
