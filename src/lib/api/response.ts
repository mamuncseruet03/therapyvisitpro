import { NextResponse } from "next/server";

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function apiError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * requireAuth()/requireRole() throw plain Error("Unauthorized")/Error("Forbidden") —
 * map those to the right HTTP status, everything else to 500.
 */
export function handleApiError(err: unknown) {
  if (err instanceof Error) {
    if (err.message === "Unauthorized") return apiError("Unauthorized", 401);
    if (err.message === "Forbidden") return apiError("Forbidden", 403);
    if (err.message === "Not found") return apiError("Not found", 404);
  }
  return apiError("Internal server error", 500);
}
