import { NextRequest } from "next/server";
import { apiError, apiSuccess, handleApiError } from "@/lib/api/response";
import { resetPasswordSchema } from "@/lib/validations/user";
import { resetPasswordWithToken } from "@/lib/auth/password-reset";

export async function POST(request: NextRequest) {
  try {
    const parsed = resetPasswordSchema.safeParse(await request.json());
    if (!parsed.success) return apiError(parsed.error.issues[0].message, 400);
    const result = await resetPasswordWithToken(parsed.data.token, parsed.data.newPassword);
    if (result.error) return apiError(result.error, 400);
    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}
