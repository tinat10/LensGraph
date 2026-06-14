import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  providers: [],
  pages: {
    signIn: "/signin",
  },
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isProtectedPage =
        pathname.startsWith("/dashboard") ||
        pathname.startsWith("/collections") ||
        pathname.startsWith("/profile");

      if (isProtectedPage) return !!auth?.user;
      return true;
    },
  },
} satisfies NextAuthConfig;
