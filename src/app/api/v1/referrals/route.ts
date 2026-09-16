import { NextRequest } from "next/server";
import { getReferrals, createReferral } from "@/components/patients/referral-actions";
import { apiSuccess, handleApiError } from "@/lib/api/response";

export async function GET() {
  try {
    const referrals = await getReferrals();
    return apiSuccess(referrals);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const result = await createReferral(data);
    return apiSuccess(result, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
