import { NextRequest } from "next/server";
import { updateInvoice, deleteInvoice } from "@/app/(app)/Invoices/actions";
import { apiSuccess, handleApiError } from "@/lib/api/response";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();
    const result = await updateInvoice(id, data);
    return apiSuccess(result);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await deleteInvoice(id);
    return apiSuccess(result);
  } catch (err) {
    return handleApiError(err);
  }
}
