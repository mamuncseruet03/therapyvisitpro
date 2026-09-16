import { getPayrollData } from "@/app/(app)/Payroll/actions";
import { apiSuccess, handleApiError } from "@/lib/api/response";

export async function GET() {
  try {
    const data = await getPayrollData();
    return apiSuccess(data);
  } catch (err) {
    return handleApiError(err);
  }
}
