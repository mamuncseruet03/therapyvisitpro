import { getUsersForSelect } from "@/app/(app)/TaskAssignment/actions";
import { apiSuccess, handleApiError } from "@/lib/api/response";

// Lightweight user list (id/email/name) for assignment dropdowns — open to
// any authenticated user (requireAuth()), unlike the full GET /api/v1/users
// which is restricted to SUPERUSER/ADMIN.
export async function GET() {
  try {
    const users = await getUsersForSelect();
    return apiSuccess(users);
  } catch (err) {
    return handleApiError(err);
  }
}
