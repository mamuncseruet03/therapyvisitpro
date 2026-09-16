import { requireAuth } from "@/lib/auth/session";
import { getNotifications } from "@/components/dashboard/dashboard-actions";
import { apiSuccess, handleApiError } from "@/lib/api/response";

// Always scoped to the authenticated caller's own email — getNotifications()
// has no ownership check, so a client-supplied recipientEmail must never be
// trusted here.
export async function GET() {
  try {
    const user = await requireAuth();
    const notifications = await getNotifications(user.email);
    return apiSuccess(notifications);
  } catch (err) {
    return handleApiError(err);
  }
}
