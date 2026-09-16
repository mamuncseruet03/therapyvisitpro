import type { NextAuthConfig } from "next-auth";
import type { SessionUser } from "./types";

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
      const isAuthPage = request.nextUrl.pathname.startsWith("/login");

      if (isAuthPage) {
        if (isLoggedIn) return Response.redirect(new URL("/", request.nextUrl));
        return true;
      }

      return isLoggedIn;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
