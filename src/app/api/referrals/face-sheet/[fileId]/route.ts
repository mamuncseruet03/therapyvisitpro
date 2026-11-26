import { readFile } from "fs/promises";
import { extname, join } from "path";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";

export const runtime = "nodejs";

const FACE_SHEET_DIR = join(process.cwd(), "storage", "referral-face-sheets");
const SAFE_FILE_ID = /^[0-9a-f-]{36}\.(pdf|jpg|png|webp)$/i;
const CONTENT_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

export async function GET(_request: Request, { params }: { params: Promise<{ fileId: string }> }) {
  try {
    await requireAuth();
    const { fileId } = await params;
    if (!SAFE_FILE_ID.test(fileId)) {
      return NextResponse.json({ error: "Invalid face sheet" }, { status: 400 });
    }

    const contents = await readFile(join(FACE_SHEET_DIR, fileId));
    return new Response(contents, {
      headers: {
        "Content-Type": CONTENT_TYPES[extname(fileId).toLowerCase()] || "application/octet-stream",
        "Content-Disposition": `inline; filename="face-sheet${extname(fileId)}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return NextResponse.json({ error: "Face sheet not found" }, { status: 404 });
    }
    console.error("Face sheet download failed:", error);
    return NextResponse.json({ error: "Unable to load face sheet" }, { status: 500 });
  }
}
