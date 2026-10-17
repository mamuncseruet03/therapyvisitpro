import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";
import { apiSuccess, handleApiError } from "@/lib/api/response";
import type { NextRequest } from "next/server";

const therapyDisplay: Record<string, string> = {
  PT: "Physical Therapy",
  OT: "Occupational Therapy",
  ST: "Speech Therapy",
};

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const requestedTherapistId = request.nextUrl.searchParams.get("therapistId");
    const exactTherapistId = user.userType === "SUPERUSER" && requestedTherapistId
      ? requestedTherapistId
      : user.therapistId;

    // Resolve the explicit user-to-therapist link first. An OR query could
    // return a different therapist whose name happened to match the account.
    let therapist = exactTherapistId
      ? await prisma.therapist.findUnique({ where: { id: exactTherapistId } })
      : null;
    if (!therapist) {
      therapist = await prisma.therapist.findFirst({
        where: { email: { equals: user.email, mode: "insensitive" } },
      });
    }
    if (!therapist && user.name) {
      therapist = await prisma.therapist.findFirst({
        where: { fullName: { equals: user.name, mode: "insensitive" } },
      });
    }

    if (!therapist) return apiSuccess(null);

    return apiSuccess({
      id: therapist.id,
      full_name: therapist.fullName,
      discipline: therapyDisplay[therapist.discipline] || therapist.discipline,
      credentials: therapist.credentials,
      license_number: therapist.licenseNumber,
      email: therapist.email,
      phone: therapist.phone,
      hire_date: therapist.hireDate,
      annual_review_date: therapist.annualReviewDate,
      status: therapist.status?.toLowerCase(),
      facilities: therapist.facilities || [],
      rates: therapist.rates || {},
      personal_files: therapist.personalFiles || {},
      disciplinary_actions: therapist.disciplinaryActions || [],
      created_at: therapist.createdAt,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth();
    const requestedTherapistId = request.nextUrl.searchParams.get("therapistId");
    const therapistId = user.userType === "SUPERUSER" && requestedTherapistId
      ? requestedTherapistId
      : user.therapistId;

    if (!therapistId) {
      return new Response(JSON.stringify({ error: "No therapist profile is linked to this account" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const data = await request.json();
    const disciplineMap: Record<string, "PT" | "OT" | "ST"> = {
      "Physical Therapy": "PT",
      "Occupational Therapy": "OT",
      "Speech Therapy": "ST",
    };
    const updateData: Record<string, unknown> = {};
    if (data.full_name !== undefined) updateData.fullName = data.full_name;
    if (data.discipline !== undefined) updateData.discipline = disciplineMap[data.discipline] || data.discipline;
    if (data.credentials !== undefined) updateData.credentials = data.credentials || null;
    if (data.license_number !== undefined) updateData.licenseNumber = data.license_number || null;
    if (data.phone !== undefined) updateData.phone = data.phone || null;
    if (data.personal_files !== undefined) updateData.personalFiles = data.personal_files;

    await prisma.therapist.update({ where: { id: therapistId }, data: updateData });
    return apiSuccess({ success: true, id: therapistId });
  } catch (error) {
    return handleApiError(error);
  }
}
