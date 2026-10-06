"use server";

import { prisma } from "@/lib/db";
import { requireAuth, requireRole } from "@/lib/auth/session";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { logAudit } from "@/lib/audit";
import { headers } from "next/headers";
import { getClientIp } from "@/lib/audit/logger";
import { createUserSchema, updateUserSchema } from "@/lib/validations/user";
import { randomBytes } from "crypto";
import nodemailer from "nodemailer";

const upper = (v) => (typeof v === "string" ? v.toUpperCase() : v);

// inviteUser only ever receives {email, userType} (see route.ts) — createUserSchema
// also requires password/fullName, which inviteUser never gets (it self-generates
// the password and doesn't collect a name), so validate against a subset instead
// of the full schema.
const inviteUserSchema = createUserSchema.pick({ email: true, userType: true });

function getInviteMailConfig() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !SMTP_FROM) {
    throw new Error(
      "Invitation email is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS and SMTP_FROM.",
    );
  }

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

async function sendInvitationEmail({ email, userType, temporaryPassword }) {
  const { transporter, from } = getInviteMailConfig();
  const appUrl = (
    process.env.APP_URL ||
    process.env.AUTH_URL ||
    process.env.NEXTAUTH_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");

  await transporter.sendMail({
    from,
    to: email,
    subject: "You're invited to TherapyDocs",
    text: [
      "You have been invited to TherapyDocs.",
      `Account type: ${userType.toLowerCase()}`,
      `Sign in: ${appUrl}/login`,
      `Temporary password: ${temporaryPassword}`,
      "Please sign in and keep this password secure.",
    ].join("\n\n"),
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
        <h2 style="color:#0f766e">You're invited to TherapyDocs</h2>
        <p>An administrator created a <strong>${userType.toLowerCase()}</strong> account for you.</p>
        <p><a href="${appUrl}/login" style="display:inline-block;background:#0d9488;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">Sign in to TherapyDocs</a></p>
        <p><strong>Email:</strong> ${email}<br/><strong>Temporary password:</strong> <code>${temporaryPassword}</code></p>
        <p style="color:#64748b;font-size:13px">Please keep this password secure.</p>
      </div>
    `,
  });
}

// Deliberately excludes `discipline`: the schema's Discipline enum expects
// short codes (PT/OT/ST), but the UserManagement edit form's discipline <Select>
// sends the long-form label ("Physical Therapy", ...) and updateUser has
// always persisted it as-is (unlike Therapists' updateTherapist, which maps
// through DISCIPLINE_MAP first) — so User.discipline's real stored shape is
// long-form, not the schema's short-form. Left unvalidated to avoid rejecting
// currently-working edits.
function toValidationInput(data) {
  return {
    phone: data.phone,
    userType: data.user_type ? upper(data.user_type) : undefined,
    credentials: data.credentials,
    licenseNumber: data.license_number,
  };
}

function toSnakeCase(user) {
  return {
    id: user.id,
    email: user.email,
    full_name: user.fullName,
    phone: user.phone,
    role: user.role?.toLowerCase(),
    user_type: user.userType?.toLowerCase(),
    therapist_id: user.therapistId,
    credentials: user.credentials,
    license_number: user.licenseNumber,
    discipline: user.discipline,
    created_at: user.createdAt,
  };
}

export async function getUsers() {
  await requireRole("SUPERUSER", "ADMIN");

  const users = await prisma.user.findMany({
    where: {
      email: {
        in: [
          "compliance1@aaahealthgroup.com",
          "ameya@aaahealthgroup.com",
          "intake2@aaahealthgroup.com",
          "rehab@aaahealthgroup.com",
          "adorsatwar@apexrehabgroup.com",
          "dorsatwar.ameya@gmail.com",
        ],
      },
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      phone: true,
      role: true,
      userType: true,
      therapistId: true,
      credentials: true,
      licenseNumber: true,
      discipline: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return users.map(toSnakeCase);
}

export async function inviteUser({ email, userType }) {
  const user = await requireRole("SUPERUSER", "ADMIN");

  const parsed = inviteUserSchema.safeParse({ email, userType: upper(userType) });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  const v = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email: v.email } });
  if (existing) {
    return { error: "A user with this email already exists" };
  }

  const roleMap = {
    superuser: "SUPERUSER",
    admin: "ADMIN",
    therapist: "USER",
    coordinator: "USER",
    hr: "USER",
    guest: "USER",
    client: "USER",
  };

  // Validate SMTP before creating the account so a configuration error cannot
  // leave behind a user who never received login credentials.
  getInviteMailConfig();

  const temporaryPassword = randomBytes(12).toString("base64url");
  const passwordHash = await hashPassword(temporaryPassword);

  const invitedUser = await prisma.user.create({
    data: {
      email: v.email,
      passwordHash,
      role: roleMap[v.userType.toLowerCase()] ?? "USER",
      userType: v.userType,
    },
  });

  try {
    await sendInvitationEmail({
      email: v.email,
      userType: v.userType,
      temporaryPassword,
    });
  } catch (error) {
    await prisma.user.delete({ where: { id: invitedUser.id } });
    throw error;
  }

  const h = await headers();
  await logAudit({
    user,
    action: "CREATE",
    resourceType: "User",
    details: `Invited user ${email} as ${userType}`,
    ipAddress: getClientIp(h),
  });

  return { success: true, email_sent: true };
}

export async function updateUser({ id, data }) {
  const user = await requireRole("SUPERUSER", "ADMIN");

  const parsed = updateUserSchema.safeParse(toValidationInput(data));
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  const v = parsed.data;

  const roleMap = {
    superuser: "SUPERUSER",
    admin: "ADMIN",
    therapist: "USER",
    coordinator: "USER",
    hr: "USER",
    guest: "USER",
    client: "USER",
  };

  const updateData = {};
  if (v.userType !== undefined) {
    updateData.userType = v.userType;
    updateData.role = roleMap[data.user_type] ?? "USER";
  }
  if (v.phone !== undefined) updateData.phone = v.phone;
  if (v.credentials !== undefined) updateData.credentials = v.credentials;
  if (v.licenseNumber !== undefined) updateData.licenseNumber = v.licenseNumber;
  if (data.discipline !== undefined) updateData.discipline = data.discipline || null;

  await prisma.user.update({ where: { id }, data: updateData });

  const h = await headers();
  await logAudit({
    user,
    action: "UPDATE",
    resourceType: "User",
    resourceId: id,
    details: "Updated user profile",
    ipAddress: getClientIp(h),
  });

  return { success: true };
}

export async function syncTherapistsToUsers() {
  const user = await requireRole("SUPERUSER", "ADMIN");

  const therapists = await prisma.therapist.findMany({
    where: { status: "ACTIVE" },
    select: {
      id: true,
      fullName: true,
      email: true,
      credentials: true,
      licenseNumber: true,
      discipline: true,
    },
  });

  let created = 0;
  let linked = 0;

  for (const therapist of therapists) {
    if (!therapist.email) continue;

    const existingUser = await prisma.user.findUnique({ where: { email: therapist.email } });

    if (existingUser) {
      if (!existingUser.therapistId) {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            therapistId: therapist.id,
            discipline: therapist.discipline,
            credentials: therapist.credentials,
            licenseNumber: therapist.licenseNumber,
          },
        });
        linked++;
      }
    } else {
      const passwordHash = await hashPassword("changeme123");
      await prisma.user.create({
        data: {
          email: therapist.email,
          passwordHash,
          fullName: therapist.fullName,
          role: "USER",
          userType: "THERAPIST",
          therapistId: therapist.id,
          discipline: therapist.discipline,
          credentials: therapist.credentials,
          licenseNumber: therapist.licenseNumber,
        },
      });
      created++;
    }
  }

  const h = await headers();
  await logAudit({
    user,
    action: "UPDATE",
    resourceType: "User",
    details: `Synced therapists: ${created} created, ${linked} linked`,
    ipAddress: getClientIp(h),
  });

  return { created, linked };
}

export async function verifyCurrentUserPassword(password) {
  const sessionUser = await requireAuth();

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { passwordHash: true },
  });

  if (!user?.passwordHash) {
    return { success: false, error: "Account has no password set" };
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return { success: false, error: "Incorrect password" };
  }

  return { success: true };
}
