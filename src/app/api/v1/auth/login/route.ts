import { NextRequest } from "next/server";
import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";
import { loginSchema } from "@/lib/validations/user";
import { apiSuccess, apiError } from "@/lib/api/response";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0].message, 400);
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
    return apiSuccess({ success: true });
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") {
        return apiError("Invalid email or password", 401);
      }
      return apiError("An authentication error occurred", 401);
    }
    throw error;
  }
}
