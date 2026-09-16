import { NextRequest } from "next/server";
import { getAgencies, createAgency } from "@/app/(app)/Agencies/actions";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";

export async function GET() {
  try {
    const agencies = await getAgencies();
    return apiSuccess(agencies);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const result = await createAgency(data);
    if (result?.error) return apiError(result.error, 400);
    return apiSuccess(result, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
