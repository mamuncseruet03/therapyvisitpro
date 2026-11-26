import { NextRequest } from "next/server";
import { deletePayer, updatePayer } from "@/app/(app)/Payers/actions";
import { apiSuccess, handleApiError } from "@/lib/api/response";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try { const { id } = await context.params; return apiSuccess(await updatePayer(id, await request.json())); }
  catch (error) { return handleApiError(error); }
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try { const { id } = await context.params; return apiSuccess(await deletePayer(id)); }
  catch (error) { return handleApiError(error); }
}
