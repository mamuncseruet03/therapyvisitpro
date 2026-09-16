import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, requireRole } from "@/lib/auth/session";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";

const COLORS = new Set(["BLUE", "AMBER", "GREEN", "RED"]);

export async function GET() {
  try {
    await requireAuth();
    const announcement = await prisma.announcement.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: "desc" },
    });
    return apiSuccess(announcement ? {
      id: announcement.id,
      message: announcement.message,
      color: announcement.color.toLowerCase(),
    } : null);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole("SUPERUSER");
    const body = await request.json();
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const color = String(body.color || "BLUE").toUpperCase();
    if (!message) return apiError("Message is required", 400);
    if (!COLORS.has(color)) return apiError("Invalid color", 400);

    await prisma.$transaction([
      prisma.announcement.updateMany({ where: { isActive: true }, data: { isActive: false } }),
      prisma.announcement.create({ data: { message, color: color as "BLUE" | "AMBER" | "GREEN" | "RED" } }),
    ]);
    return apiSuccess({ success: true }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

