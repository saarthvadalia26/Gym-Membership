import type { NextAuthConfig } from "next-auth";

// Edge-safe slice of the NextAuth config — no DB, no bcrypt, no providers that
// need Node APIs. Imported by middleware.ts (which runs on the Edge runtime)
// and re-used by the full Node-only config in `auth.ts`.
export const authConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.gymId = (user as { gymId?: string }).gymId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.id && session.user) {
        (session.user as { id?: string; gymId?: string }).id = token.id as string;
        (session.user as { id?: string; gymId?: string }).gymId = token.gymId as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
