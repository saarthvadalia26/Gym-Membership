import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "./db";
import { authConfig } from "./auth.config";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (raw) => {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        return { id: user.id, email: user.email, gymId: user.gymId };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
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
});

/**
 * Returns the current authenticated user's gymId. Redirects to /login if
 * there is no session, or if the session was created before multi-tenancy
 * existed (legacy JWTs without gymId). Every API route and Server Component
 * that touches gym data MUST go through this so we never accidentally query
 * across tenants.
 */
export async function requireGymId(): Promise<string> {
  const session = await auth();
  const gymId = (session?.user as { gymId?: string } | undefined)?.gymId;
  if (!gymId) {
    // Forces a fresh sign-in so the new JWT picks up gymId
    redirect("/login");
  }
  return gymId;
}
