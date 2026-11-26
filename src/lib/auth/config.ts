import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { licenseBlocksAccess } from "@/lib/therapist-license";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import type { SessionUser } from "./types";
import { authConfig } from "./auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = String(credentials.email).trim().toLowerCase();
        const password = credentials.password as string;

        // Select only columns present in both legacy and current databases.
        // Some local/older installs predate users.is_active; selecting the
        // complete User model makes Prisma throw P2022 before bcrypt runs.
        const user = await prisma.user.findFirst({
          where: { email: { equals: email, mode: "insensitive" } },
          select: {
            id: true,
            email: true,
            passwordHash: true,
            fullName: true,
            role: true,
            userType: true,
            therapistId: true,
            discipline: true,
          },
        });

        if (!user) {
          return null;
        }

        // to_jsonb(row) works whether the legacy table has is_active or not.
        // Missing keys fall back to true; migrated databases still enforce
        // account deactivation at login.
        const activeRows = await prisma.$queryRaw<Array<{ active: boolean }>>`
          SELECT COALESCE((to_jsonb(u)->>'is_active')::boolean, true) AS active
          FROM "users" u
          WHERE u."id" = ${user.id}
          LIMIT 1
        `;
        if (activeRows[0]?.active === false) return null;
        if (user.userType === "THERAPIST" && user.therapistId) {
          const therapist = await prisma.therapist.findUnique({
            where: { id: user.therapistId },
            select: { personalFiles: true },
          });
          if (licenseBlocksAccess(therapist?.personalFiles)) return null;
        }


        const passwordValid = await bcrypt.compare(password, user.passwordHash);
        if (!passwordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.fullName ?? user.email,
          role: user.role,
          userType: user.userType,
          therapistId: user.therapistId,
          discipline: user.discipline,
        } satisfies SessionUser;
      },
    }),
  ],
});
