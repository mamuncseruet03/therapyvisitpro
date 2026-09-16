import { getAgenciesForInvoice } from "@/app/(app)/Invoices/actions";
import { apiSuccess, handleApiError } from "@/lib/api/response";

// Read-only, invoice-specific agency lookup (includes rates) — distinct
// from the generic GET /api/v1/agencies.
export async function GET() {
  try {
    const agencies = await getAgenciesForInvoice();
    return apiSuccess(agencies);
  } catch (err) {
    return handleApiError(err);
  }
}
