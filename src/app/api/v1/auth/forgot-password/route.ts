import { NextRequest } from "next/server";
import { apiError, apiSuccess, handleApiError } from "@/lib/api/response";
import { forgotPasswordSchema } from "@/lib/validations/user";
import { requestPasswordReset } from "@/lib/auth/password-reset";

const GENERIC_MESSAGE = "If an active account exists for that email, a reset link has been sent.";

export async function POST(request: NextRequest) {
  try {
    const parsed = forgotPasswordSchema.safeParse(await request.json());
    if (!parsed.success) return apiError(parsed.error.issues[0].message, 400);
    try {
      await requestPasswordReset(parsed.data.email);
    } catch (error) {
      console.error("Password reset email failed", error);
    }
    return apiSuccess({ success: true, message: GENERIC_MESSAGE });
  } catch (error) {
    return handleApiError(error);
  }
}
