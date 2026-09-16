import { getCalendarVisits } from "@/app/(app)/VisitCalendar/actions";
import { apiSuccess, handleApiError } from "@/lib/api/response";

export async function GET() {
  try {
    const visits = await getCalendarVisits();
    return apiSuccess(visits);
  } catch (err) {
    return handleApiError(err);
  }
}
