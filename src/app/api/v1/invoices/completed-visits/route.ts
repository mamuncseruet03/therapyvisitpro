import { getCompletedVisitsForInvoice } from "@/app/(app)/Invoices/actions";
import { apiSuccess, handleApiError } from "@/lib/api/response";

export async function GET() {
  try {
    const visits = await getCompletedVisitsForInvoice();
    return apiSuccess(visits);
  } catch (err) {
    return handleApiError(err);
  }
}
