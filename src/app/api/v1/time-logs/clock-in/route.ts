import { requireAuth } from "@/lib/auth/session";
import { clockIn } from "@/app/(app)/MyLabor/actions";
import { apiSuccess, handleApiError } from "@/lib/api/response";

// Identity always comes from the authenticated session, never the request
// body — clockIn() writes whatever userId/userName/userEmail it's given.
export async function POST() {
  try {
    const user = await requireAuth();
    const result = await clockIn(user.id, user.name, user.email);
    return apiSuccess(result, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
