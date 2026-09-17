import type { NextAuthConfig } from "next-auth";
import type { SessionUser } from "./types";
import { hasApiAccessByPath, hasRouteAccessByPath } from "@/lib/rbac/permissions";

export const authConfig = {
  session: {
    strategy: "jwt",
    maxAge: 60 * 60,
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.email = user.email!;
        token.name = user.name!;
        token.role = (user as SessionUser).role;
        token.userType = (user as SessionUser).userType;
        token.therapistId = (user as SessionUser).therapistId;
        token.discipline = (user as SessionUser).discipline;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = {
        ...session.user,
        id: token.id as string,
        email: token.email as string,
        name: token.name as string,
        role: token.role as SessionUser["role"],
        userType: token.userType as SessionUser["userType"],
        therapistId: (token.therapistId as string) ?? null,
        discipline: (token.discipline as SessionUser["discipline"]) ?? null,
      };
      return session;
    },
    async authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const pathname = request.nextUrl.pathname;
      const isAuthPage = pathname.startsWith("/login");
      const isApiRoute = pathname.startsWith("/api/v1/");
      const isLoginApi = pathname === "/api/v1/auth/login";

      if (isLoginApi) return true;

      if (isAuthPage) {
        if (isLoggedIn) return Response.redirect(new URL("/", request.nextUrl));
        return true;
      }

      if (!isLoggedIn) {
        return isApiRoute
          ? Response.json({ error: "Unauthorized" }, { status: 401 })
          : false;
      }

      const userType = auth.user.userType;
      const allowed = isApiRoute
        ? hasApiAccessByPath(userType, pathname)
        : hasRouteAccessByPath(userType, pathname);

      if (allowed) return true;

      return isApiRoute
        ? Response.json({ error: "Forbidden" }, { status: 403 })
        : Response.redirect(new URL("/", request.nextUrl));
    },
  },
  providers: [],
} satisfies NextAuthConfig;
