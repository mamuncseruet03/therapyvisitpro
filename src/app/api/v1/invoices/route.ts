import { NextRequest } from "next/server";
import { getInvoices, createInvoice } from "@/app/(app)/Invoices/actions";
import { apiSuccess, handleApiError } from "@/lib/api/response";

export async function GET() {
  try {
    const invoices = await getInvoices();
    return apiSuccess(invoices);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const result = await createInvoice(data);
    return apiSuccess(result, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
