import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import { randomUUID } from "crypto";
import { extname, join } from "path";
import { requireRole } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit/logger";

export const runtime = "nodejs";

const MAX_SIZE = 10 * 1024 * 1024;
const FACE_SHEET_DIR = join(process.cwd(), "storage", "referral-face-sheets");
const ALLOWED_TYPES = new Map([
  ["application/pdf", ".pdf"],
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
]);

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole("SUPERUSER", "ADMIN", "COORDINATOR");
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No face sheet provided" }, { status: 400 });
    }
    if (file.size === 0 || file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Face sheet must be between 1 byte and 10 MB" }, { status: 400 });
    }

    const allowedExtension = ALLOWED_TYPES.get(file.type);
    const providedExtension = extname(file.name).toLowerCase();
    if (!allowedExtension || (providedExtension && ![allowedExtension, ".jpeg"].includes(providedExtension))) {
      return NextResponse.json({ error: "Upload a PDF, JPG, PNG, or WebP file" }, { status: 400 });
    }

    const fileId = `${randomUUID()}${allowedExtension}`;
    await mkdir(FACE_SHEET_DIR, { recursive: true });
    await writeFile(join(FACE_SHEET_DIR, fileId), new Uint8Array(await file.arrayBuffer()), { flag: "wx" });

    await logAudit({
      user,
      action: "CREATE",
      resourceType: "ReferralFaceSheet",
      resourceId: fileId,
      resourceLabel: file.name,
      details: `Size: ${(file.size / 1024).toFixed(1)} KB, Type: ${file.type}`,
    });

    return NextResponse.json({
      url: `/api/referrals/face-sheet/${fileId}`,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      uploadedAt: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof Error && (error.message.includes("Unauthorized") || error.message.includes("Forbidden"))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Face sheet upload failed:", error);
    return NextResponse.json({ error: "Face sheet upload failed" }, { status: 500 });
  }
}
