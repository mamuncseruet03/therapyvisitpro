"use server";

import { prisma } from "@/lib/db";
import { requireAuth, requireRole } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit";
import { headers } from "next/headers";
import { getClientIp } from "@/lib/audit/logger";

export async function getCompanyInfo() {
  await requireAuth();

  const info = await prisma.companyInfo.findFirst();
  if (!info) return null;

  const addr = info.address || {};
  const hours = info.businessHours || {};

  return {
    id: info.id,
    company_name: info.companyName,
    logo_url: info.logoUrl,
    tagline: info.tagline,
    description: info.description,
    phone: info.phone,
    email: info.email,
    address_line1: addr.line1 || null,
    address_line2: addr.line2 || null,
    address_line3: addr.line3 || null,
    monday_friday_hours: hours.weekday || null,
    weekend_hours: hours.weekend || null,
    menu_permissions: info.menuPermissions,
  };
}

export async function saveCompanyInfo(data) {
  const user = await requireRole("SUPERUSER");

  const existing = await prisma.companyInfo.findFirst();

  const payload = {
    companyName: data.company_name || null,
    logoUrl: data.logo_url || null,
    tagline: data.tagline || null,
    description: data.description || null,
    phone: data.phone || null,
    email: data.email || null,
    address: {
      line1: data.address_line1 || null,
      line2: data.address_line2 || null,
      line3: data.address_line3 || null,
    },
    businessHours: {
      weekday: data.monday_friday_hours || null,
      weekend: data.weekend_hours || null,
    },
  };

  if (existing) {
    await prisma.companyInfo.update({
      where: { id: existing.id },
      data: payload,
    });
  } else {
    await prisma.companyInfo.create({ data: payload });
  }

  const h = await headers();
  await logAudit({
    user,
    action: "UPDATE",
    resourceType: "CompanyInfo",
    details: "Updated company information",
    ipAddress: getClientIp(h),
  });

  return { success: true };
}

export async function saveMenuPermissions(permissions) {
  const user = await requireRole("SUPERUSER");

  const existing = await prisma.companyInfo.findFirst();

  if (existing) {
    await prisma.companyInfo.update({
      where: { id: existing.id },
      data: { menuPermissions: permissions },
    });
  } else {
    await prisma.companyInfo.create({
      data: { menuPermissions: permissions },
    });
  }

  const h = await headers();
  await logAudit({
    user,
    action: "UPDATE",
    resourceType: "CompanyInfo",
    details: "Updated menu permissions",
    ipAddress: getClientIp(h),
  });

  return { success: true };
}
