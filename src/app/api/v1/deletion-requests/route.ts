import { getDeletionRequests } from "@/app/(app)/Orders/actions";
import { apiSuccess, handleApiError } from "@/lib/api/response";

export async function GET() {
  try {
    const requests = await getDeletionRequests();
    return apiSuccess(requests);
  } catch (err) {
    return handleApiError(err);
  }
}
