import { NextRequest } from "next/server";
import { saveMenuPermissions } from "@/app/(app)/CompanyInformation/actions";
import { apiSuccess, handleApiError } from "@/lib/api/response";

export async function PATCH(request: NextRequest) {
  try {
    const permissions = await request.json();
    const result = await saveMenuPermissions(permissions);
    return apiSuccess(result);
  } catch (err) {
    return handleApiError(err);
  }
}
