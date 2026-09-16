import { NextRequest } from "next/server";
import { getCompanyInfo, saveCompanyInfo } from "@/app/(app)/CompanyInformation/actions";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";

export async function GET() {
  try {
    const info = await getCompanyInfo();
    if (!info) return apiError("Not found", 404);
    return apiSuccess(info);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const data = await request.json();
    const result = await saveCompanyInfo(data);
    return apiSuccess(result);
  } catch (err) {
    return handleApiError(err);
  }
}
