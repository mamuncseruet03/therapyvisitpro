import { apiUrl, handleResponse } from "./_fetch";

export async function getTasks() {
  const res = await fetch(apiUrl("/api/v1/tasks"));
  return handleResponse(res);
}

// The REST endpoint always scopes to the authenticated session — any
// email argument is accepted (to match existing call sites) but ignored.
export async function getMyTasks(_email?: string) {
  const res = await fetch(apiUrl("/api/v1/tasks/mine"));
  return handleResponse(res);
}

export async function createTask(data: unknown) {
  const res = await fetch(apiUrl("/api/v1/tasks"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function updateTask(id: string, data: unknown) {
  const res = await fetch(apiUrl(`/api/v1/tasks/${id}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

// Mirrors the original updateTaskStatus() action: also auto-stamps
// completed_date when transitioning to "completed", since PATCH
// /api/v1/tasks/[id] (updateTask) doesn't do that automatically.
export async function updateTaskStatus(id: string, status: string) {
  const data: Record<string, unknown> = { status };
  if (status === "completed") {
    data.completed_date = new Date().toISOString();
  }
  return updateTask(id, data);
}

// createdByEmail/createdByName are accepted (to match existing call sites)
// but ignored — the REST endpoint always derives the follow-up task's
// assignee from the authenticated session, not the request body.
export async function escalateTask(data: {
  taskId: string;
  escalatedTo: string;
  escalatedToName: string;
  reason: string;
  followUpDate?: string;
  createdByEmail?: string;
  createdByName?: string;
}) {
  const { taskId, escalatedTo, escalatedToName, reason, followUpDate } = data;
  const res = await fetch(apiUrl(`/api/v1/tasks/${taskId}/escalate`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ escalatedTo, escalatedToName, reason, followUpDate }),
  });
  return handleResponse(res);
}

export async function deleteTask(id: string) {
  const res = await fetch(apiUrl(`/api/v1/tasks/${id}`), { method: "DELETE" });
  return handleResponse(res);
}

export async function getUsersForSelect() {
  const res = await fetch(apiUrl("/api/v1/users/for-select"));
  return handleResponse(res);
}
