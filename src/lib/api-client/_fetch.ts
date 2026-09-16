// Empty by default — same-origin requests (relative paths), unchanged
// behavior. Set NEXT_PUBLIC_API_URL when the API is served from a
// different origin than the frontend (e.g. a separate deployment).
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export function apiUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}

export async function handleResponse(res: Response) {
  const body = await res.json();
  if (!res.ok) throw new Error(body?.error || "Request failed");
  return body;
}
