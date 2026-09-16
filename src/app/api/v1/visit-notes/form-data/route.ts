import { getVisitFormData } from "@/app/(app)/VisitNotes/actions";
import { apiSuccess, handleApiError } from "@/lib/api/response";

// Bundled patients+therapists+agencies lookup for the visit note form,
// open to any authenticated user (requireAuth()) — kept as its own endpoint
// rather than decomposed into the individual resource endpoints, since
// GET /api/v1/agencies is more restrictive (SUPERUSER/ADMIN/COORDINATOR)
// than this bundle needs to be.
export async function GET() {
  try {
    const data = await getVisitFormData();
    return apiSuccess(data);
  } catch (err) {
    return handleApiError(err);
  }
}
