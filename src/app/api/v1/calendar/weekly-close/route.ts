import { getWeeklyCloseData } from "@/app/(app)/VisitCalendar/actions";
import { apiSuccess, handleApiError } from "@/lib/api/response";

export async function GET() {
  try {
    const data = await getWeeklyCloseData();
    return apiSuccess(data);
  } catch (err) {
    return handleApiError(err);
  }
}
