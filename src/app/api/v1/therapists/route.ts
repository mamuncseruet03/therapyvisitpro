import { NextRequest } from "next/server";
import { getTherapists, createTherapist } from "@/app/(app)/Therapists/actions";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";

export async function GET() {
  try {
    const therapists = await getTherapists();
    return apiSuccess(therapists);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const result = await createTherapist(data);
    if (result?.error) return apiError(result.error, 400);
    return apiSuccess(result, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
