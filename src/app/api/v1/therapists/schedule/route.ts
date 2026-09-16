import { getTherapistsForSchedule } from "@/app/(app)/VisitCalendar/actions";
import { apiSuccess, handleApiError } from "@/lib/api/response";

// Lightweight therapist list for schedule/calendar UI — open to any
// authenticated user (getTherapistsForSchedule uses requireAuth(), not
// requireRole()), unlike the broader GET /api/v1/therapists which is
// restricted to SUPERUSER/ADMIN/COORDINATOR/HR.
export async function GET() {
  try {
    const therapists = await getTherapistsForSchedule();
    return apiSuccess(therapists);
  } catch (err) {
    return handleApiError(err);
  }
}
