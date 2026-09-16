"use server";

import { prisma } from "@/lib/db";
import { requireAuth, requireRole } from "@/lib/auth/session";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { logAudit } from "@/lib/audit";
import { headers } from "next/headers";
import { getClientIp } from "@/lib/audit/logger";
import { createUserSchema, updateUserSchema } from "@/lib/validations/user";

const upper = (v) => (typeof v === "string" ? v.toUpperCase() : v);

// inviteUser only ever receives {email, userType} (see route.ts) — createUserSchema
// also requires password/fullName, which inviteUser never gets (it self-generates
// the password and doesn't collect a name), so validate against a subset instead
// of the full schema.
const inviteUserSchema = createUserSchema.pick({ email: true, userType: true });

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

  const passwordHash = await hashPassword("changeme123");

  await prisma.user.create({
    data: {
      email: v.email,
      passwordHash,
      role: roleMap[userType] ?? "USER",
      userType: v.userType,
    },
  });

  const h = await headers();
  await logAudit({
    user,
    action: "CREATE",
    resourceType: "User",
    details: `Invited user ${email} as ${userType}`,
    ipAddress: getClientIp(h),
  });

  return { success: true };
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
