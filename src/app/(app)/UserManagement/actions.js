"use server";

import { prisma } from "@/lib/db";
import { requireAuth, requireRole } from "@/lib/auth/session";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { logAudit } from "@/lib/audit";
import { headers } from "next/headers";
import { getClientIp } from "@/lib/audit/logger";
import { changePasswordSchema, createUserSchema, updateUserSchema } from "@/lib/validations/user";
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

const DISCIPLINE_MAP = {
  PT: "PT",
  OT: "OT",
  ST: "ST",
  "Physical Therapy": "PT",
  "Occupational Therapy": "OT",
  "Speech Therapy": "ST",
};

function toValidationInput(data) {
  return {
    fullName: data.full_name,
    phone: data.phone,
    userType: data.user_type ? upper(data.user_type) : undefined,
    credentials: data.credentials,
    licenseNumber: data.license_number,
    discipline: data.discipline
      ? DISCIPLINE_MAP[data.discipline] || data.discipline
      : undefined,
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
    access_status: user.isActive === false ? "inactive" : "active",
    created_at: user.createdAt,
  };
}

async function hasUserAccessStatus() {
  const [schema] = await prisma.$queryRaw`
    SELECT EXISTS (
      SELECT 1 FROM pg_attribute
      WHERE attrelid = to_regclass('users') AND attname = 'is_active' AND NOT attisdropped
    ) AS enabled
  `;
  return schema.enabled;
}

export async function getUsers() {
  await requireRole("SUPERUSER", "ADMIN");

  const accessStatusAvailable = await hasUserAccessStatus();
  const users = await prisma.user.findMany({
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
      ...(accessStatusAvailable ? { isActive: true } : {}),
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return users.map(toSnakeCase);
}

export async function inviteUser({ email, userType }) {
  const user = await requireRole("SUPERUSER", "ADMIN");

  const normalizedEmail = email?.trim().toLowerCase();

  const parsed = inviteUserSchema.safeParse({ email: normalizedEmail, userType: upper(userType) });
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
    details: `Invited user ${v.email} as ${v.userType.toLowerCase()}`,
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
  if (v.fullName !== undefined) updateData.fullName = v.fullName;
  if (v.userType !== undefined) {
    updateData.userType = v.userType;
    updateData.role = roleMap[data.user_type] ?? "USER";
  }
  if (v.phone !== undefined) updateData.phone = v.phone;
  if (v.credentials !== undefined) updateData.credentials = v.credentials;
  if (v.licenseNumber !== undefined) updateData.licenseNumber = v.licenseNumber;
  if (data.discipline !== undefined) updateData.discipline = v.discipline || null;

  if (data.access_status !== undefined) {
    if (!["active", "inactive"].includes(data.access_status)) {
      return { error: "Access status must be active or inactive" };
    }

    if (!await hasUserAccessStatus()) {
      return { error: "Account activation requires the user access status database migration.", status: 503 };
    }

    const target = await prisma.user.findUnique({
      where: { id },
      select: { isActive: true, userType: true },
    });
    if (!target) return { error: "User not found" };

    const nextIsActive = data.access_status === "active";
    if (!nextIsActive && user.id === id) {
      return { error: "You cannot deactivate your own account" };
    }
    if (user.userType === "ADMIN" && target.userType === "SUPERUSER" && nextIsActive !== target.isActive) {
      return { error: "Admins cannot change a Super Admin's access status" };
    }
    if (!nextIsActive && target.userType === "SUPERUSER" && target.isActive) {
      const activeSuperusers = await prisma.user.count({
        where: { userType: "SUPERUSER", isActive: true },
      });
      if (activeSuperusers <= 1) {
        return { error: "The last active Super Admin cannot be deactivated" };
      }
    }
    updateData.isActive = nextIsActive;
  }

  await prisma.$transaction(async (tx) => {
    const current = await tx.user.findUnique({ where: { id }, select: { therapistId: true } });
    // Select only a column that exists in both the current and legacy schemas.
    // Without an explicit select Prisma returns every scalar field after UPDATE,
    // including users.is_active, which is not present in older databases and
    // makes otherwise valid profile edits fail with P2022.
    await tx.user.update({
      where: { id },
      data: updateData,
      select: { id: true },
    });
    if (current?.therapistId && v.fullName !== undefined) {
      await tx.therapist.update({ where: { id: current.therapistId }, data: { fullName: v.fullName }, select: { id: true } });
    }
  });

  const h = await headers();
  await logAudit({
    user,
    action: "UPDATE",
    resourceType: "User",
    resourceId: id,
    details: data.access_status !== undefined
      ? `Updated user profile; access status: ${data.access_status}`
      : "Updated user profile",
    ipAddress: getClientIp(h),
  });

  return { success: true };
}

export async function deleteUser(id) {
  const actor = await requireRole("SUPERUSER", "ADMIN");
  if (actor.id === id) return { error: "You cannot delete your own account" };

  const target = await prisma.user.findUnique({
    where: { id },
    select: { email: true, fullName: true, userType: true },
  });
  if (!target) return { error: "User not found" };
  if (actor.userType === "ADMIN" && target.userType === "SUPERUSER") {
    return { error: "Admins cannot delete a Super Admin account" };
  }
  if (target.userType === "SUPERUSER") {
    const superuserCount = await prisma.user.count({ where: { userType: "SUPERUSER" } });
    if (superuserCount <= 1) return { error: "The last Super Admin account cannot be deleted" };
  }

  await prisma.$transaction(async (tx) => {
    // Older databases may not have applied the API keys migration yet.
    const [schema] = await tx.$queryRaw`SELECT to_regclass('api_keys') IS NOT NULL AS has_api_keys`;
    if (schema.has_api_keys) {
      await tx.apiKey.deleteMany({ where: { userId: id } });
    }
    await tx.auditLog.updateMany({ where: { userId: id }, data: { userId: null } });
    await tx.notification.updateMany({ where: { recipientId: id }, data: { recipientId: null } });
    // Avoid returning newer columns such as is_active on older databases.
    await tx.user.delete({ where: { id }, select: { id: true } });
  });

  const h = await headers();
  await logAudit({
    user: actor,
    action: "DELETE",
    resourceType: "User",
    resourceId: id,
    resourceLabel: target.fullName || target.email,
    details: `Deleted ${target.userType.toLowerCase()} account ${target.email}`,
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

export async function changeCurrentUserPassword(data) {
  const sessionUser = await requireAuth();
  const parsed = changePasswordSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { passwordHash: true },
  });
  if (!user?.passwordHash) return { error: "Account has no password set" };

  const currentPasswordValid = await verifyPassword(parsed.data.currentPassword, user.passwordHash);
  if (!currentPasswordValid) return { error: "Current password is incorrect" };
  if (await verifyPassword(parsed.data.newPassword, user.passwordHash)) {
    return { error: "New password must be different from the current password" };
  }

  await prisma.user.update({
    where: { id: sessionUser.id },
    data: { passwordHash: await hashPassword(parsed.data.newPassword) },
  });

  const h = await headers();
  await logAudit({
    user: sessionUser,
    action: "UPDATE",
    resourceType: "User",
    resourceId: sessionUser.id,
    resourceLabel: sessionUser.email,
    details: "Changed account password",
    ipAddress: getClientIp(h),
  });

  return { success: true };
}
