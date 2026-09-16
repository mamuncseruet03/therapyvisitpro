import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { escalateTask } from "@/app/(app)/TaskAssignment/actions";
import { apiSuccess, handleApiError } from "@/lib/api/response";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params;
    const user = await requireAuth();
    const { escalatedTo, escalatedToName, reason, followUpDate } = await request.json();

    // createdByEmail/createdByName are always the authenticated caller —
    // escalateTask() has no ownership check, so a client-supplied identity
    // for the follow-up task's assignee must never be trusted.
    const result = await escalateTask({
      taskId,
      escalatedTo,
      escalatedToName,
      reason,
      followUpDate,
      createdByEmail: user.email,
      createdByName: user.name,
    });
    return apiSuccess(result);
  } catch (err) {
    return handleApiError(err);
  }
}
