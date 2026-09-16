import { NextRequest } from "next/server";
import { getDocuments, createDocument } from "@/app/(app)/DocumentLibrary/actions";
import { apiSuccess, handleApiError } from "@/lib/api/response";

export async function GET() {
  try {
    const docs = await getDocuments();
    return apiSuccess(docs);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const result = await createDocument(data);
    return apiSuccess(result, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
