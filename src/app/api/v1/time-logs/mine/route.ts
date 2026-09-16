import { requireAuth } from "@/lib/auth/session";
import { getTimeLogs } from "@/app/(app)/MyLabor/actions";
import { apiSuccess, handleApiError } from "@/lib/api/response";

// Always uses the authenticated caller's own email — getTimeLogs() has no
// ownership check, so a client-supplied email must never be trusted here.
export async function GET() {
  try {
    const user = await requireAuth();
    const logs = await getTimeLogs(user.email);
    return apiSuccess(logs);
  } catch (err) {
    return handleApiError(err);
  }
}
