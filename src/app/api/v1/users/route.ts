import { NextRequest } from "next/server";
import { getUsers, inviteUser } from "@/app/(app)/UserManagement/actions";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";

export async function GET() {
  try {
    const users = await getUsers();
    return apiSuccess(users);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body?.email || !body?.userType) {
      return apiError("email and userType are required", 400);
    }

    const result = await inviteUser({ email: body.email, userType: body.userType });
    if (result?.error) {
      return apiError(result.error, 400);
    }
    return apiSuccess(result, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
