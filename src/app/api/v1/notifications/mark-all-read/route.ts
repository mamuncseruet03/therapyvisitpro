import { requireAuth } from "@/lib/auth/session";
import { markAllNotificationsRead } from "@/components/dashboard/dashboard-actions";
import { apiSuccess, handleApiError } from "@/lib/api/response";

// Always scoped to the authenticated caller's own email — same guard as
// GET /api/v1/notifications above.
export async function POST() {
  try {
    const user = await requireAuth();
    const result = await markAllNotificationsRead(user.email);
    return apiSuccess(result);
  } catch (err) {
    return handleApiError(err);
  }
}
