import { requireAuth } from "@/lib/auth/session";
import { getMyTasks } from "@/app/(app)/TaskAssignment/actions";
import { apiSuccess, handleApiError } from "@/lib/api/response";

// Always uses the authenticated caller's own email — never a client-supplied
// value — since getMyTasks() has no ownership check of its own.
export async function GET() {
  try {
    const user = await requireAuth();
    const tasks = await getMyTasks(user.email);
    return apiSuccess(tasks);
  } catch (err) {
    return handleApiError(err);
  }
}
