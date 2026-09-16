import { syncTherapistsToUsers } from "@/app/(app)/UserManagement/actions";
import { apiSuccess, handleApiError } from "@/lib/api/response";

export async function POST() {
  try {
    const result = await syncTherapistsToUsers();
    return apiSuccess(result);
  } catch (err) {
    return handleApiError(err);
  }
}
