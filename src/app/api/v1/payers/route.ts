import { NextRequest } from "next/server";
import { createPayer, getPayers } from "@/app/(app)/Payers/actions";
import { apiSuccess, handleApiError } from "@/lib/api/response";

export async function GET() {
  try { return apiSuccess(await getPayers()); }
  catch (error) { return handleApiError(error); }
}

export async function POST(request: NextRequest) {
  try { return apiSuccess(await createPayer(await request.json()), 201); }
  catch (error) { return handleApiError(error); }
}
