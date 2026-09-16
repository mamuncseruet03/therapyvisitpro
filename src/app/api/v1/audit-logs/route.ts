import { getAuditLogs } from "@/app/(app)/AuditLogs/actions";
import { apiSuccess, handleApiError } from "@/lib/api/response";

export async function GET() {
  try {
    const logs = await getAuditLogs();
    return apiSuccess(logs);
  } catch (err) {
    return handleApiError(err);
  }
}
