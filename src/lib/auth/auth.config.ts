import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  providers: [],
  pages: {
    signIn: "/signin",
  },
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isProtected =
        pathname.startsWith("/dashboard") ||
        pathname.startsWith("/collections") ||
        pathname.startsWith("/api/collections") ||
        pathname.startsWith("/api/photos");

      if (isProtected) return !!auth?.user;
      return true;
    },
  },
} satisfies NextAuthConfig;
