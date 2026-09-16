import { NextRequest } from "next/server";
import { getTasks, createTask } from "@/app/(app)/TaskAssignment/actions";
import { apiSuccess, handleApiError } from "@/lib/api/response";

export async function GET() {
  try {
    const tasks = await getTasks();
    return apiSuccess(tasks);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const result = await createTask(data);
    return apiSuccess(result, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
