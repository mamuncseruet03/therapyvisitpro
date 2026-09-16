import { requireAuth } from "@/lib/auth/session";
import { getAgenciesForSelect } from "@/app/(app)/Patients/actions";
import { apiSuccess, handleApiError } from "@/lib/api/response";

// The underlying action has no auth check of its own — require at least
// an authenticated session here, consistent with every other endpoint.
export async function GET() {
  try {
    await requireAuth();
    const agencies = await getAgenciesForSelect();
    return apiSuccess(agencies);
  } catch (err) {
    return handleApiError(err);
  }
}
