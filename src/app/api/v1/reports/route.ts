import { getReportsData } from "@/app/(app)/Reports/actions";
import { apiSuccess, handleApiError } from "@/lib/api/response";

export async function GET() {
  try {
    const data = await getReportsData();
    return apiSuccess(data);
  } catch (err) {
    return handleApiError(err);
  }
}
