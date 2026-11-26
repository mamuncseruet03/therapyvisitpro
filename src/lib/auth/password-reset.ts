import { createHash, createHmac, randomBytes, timingSafeEqual } from "crypto";
import nodemailer from "nodemailer";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";

const RESET_TOKEN_TTL_SECONDS = 60 * 60;

function resetSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is required for password reset links");
  return secret;
}

function passwordFingerprint(passwordHash: string) {
  return createHash("sha256").update(passwordHash).digest("base64url").slice(0, 24);
}

function sign(payload: string) {
  return createHmac("sha256", resetSecret()).update(payload).digest("base64url");
}

function createResetToken(userId: string, passwordHash: string) {
  const payload = Buffer.from(JSON.stringify({
    userId,
    expiresAt: Math.floor(Date.now() / 1000) + RESET_TOKEN_TTL_SECONDS,
    passwordFingerprint: passwordFingerprint(passwordHash),
    nonce: randomBytes(12).toString("base64url"),
  })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function readResetToken(token: string) {
  const [payload, signature, ...extra] = token.split(".");
  if (!payload || !signature || extra.length) return null;
  const expected = sign(payload);
  const providedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (providedBuffer.length !== expectedBuffer.length || !timingSafeEqual(providedBuffer, expectedBuffer)) return null;
  try {
    const value = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!value.userId || !value.expiresAt || !value.passwordFingerprint || value.expiresAt <= Math.floor(Date.now() / 1000)) return null;
    return value;
  } catch {
    return null;
  }
}

function mailConfig() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !SMTP_FROM) throw new Error("Password reset email is not configured");
  return {
    transporter: nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT || 587),
      secure: Number(SMTP_PORT || 587) === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    }),
    from: SMTP_FROM,
  };
}

function appUrl() {
  return (process.env.APP_URL || process.env.AUTH_URL || process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/$/, "");
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character] || character);
}

export async function requestPasswordReset(email: string) {
  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    select: { id: true, email: true, fullName: true, isActive: true, passwordHash: true },
  });
  // Deliberately reveal nothing for missing or inactive accounts.
  if (!user?.isActive) return;

  const token = createResetToken(user.id, user.passwordHash);
  const resetUrl = `${appUrl()}/reset-password?token=${encodeURIComponent(token)}`;
  const { transporter, from } = mailConfig();
  await transporter.sendMail({
    from,
    to: user.email,
    subject: "Reset your TherapyDocs password",
    text: [`Hello ${user.fullName || "there"},`, "Use the link below to reset your TherapyDocs password.", resetUrl, "This link expires in 60 minutes and can only be used once.", "If you did not request this, you can ignore this email."].join("\n\n"),
    html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a"><h2 style="color:#0f766e">Reset your TherapyDocs password</h2><p>Hello ${escapeHtml(user.fullName || "there")},</p><p>Use the button below to choose a new password.</p><p><a href="${resetUrl}" style="display:inline-block;background:#0d9488;color:white;padding:10px 16px;border-radius:8px;text-decoration:none">Reset password</a></p><p style="color:#64748b;font-size:13px">This link expires in 60 minutes and can only be used once. If you did not request it, ignore this email.</p></div>`,
  });
}

export async function resetPasswordWithToken(token: string, newPassword: string) {
  const payload = readResetToken(token);
  if (!payload) return { error: "This reset link is invalid or has expired" };

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, passwordHash: true, isActive: true },
  });
  // The password fingerprint makes the signed token one-time: after a reset,
  // every link issued for the previous password immediately becomes invalid.
  if (!user?.isActive || passwordFingerprint(user.passwordHash) !== payload.passwordFingerprint) {
    return { error: "This reset link is invalid or has expired" };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(newPassword) },
  });
  return { success: true };
}
