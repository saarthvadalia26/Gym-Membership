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

        return {
          id: user.id,
          email: user.email,
          gymId: user.gymId,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
  },
});

export type Role = "OWNER" | "TRAINER";

interface SessionContext {
  gymId: string;
  userId: string;
  role: Role;
}

/**
 * Returns the current authenticated user's gymId. Redirects to /login if
 * there is no session, or if the session was created before multi-tenancy
 * existed (legacy JWTs without gymId). Every API route and Server Component
 * that touches gym data MUST go through this so we never accidentally query
 * across tenants.
 */
export async function requireGymId(): Promise<string> {
  const ctx = await requireSession();
  return ctx.gymId;
}

/**
 * Returns the full session context including user id and role. Use this
 * when you need to enforce role-based access (Owner-only actions).
 */
export async function requireSession(): Promise<SessionContext> {
  const session = await auth();
  const u = session?.user as
    | { id?: string; gymId?: string; role?: string }
    | undefined;
  if (!u?.gymId || !u.id) {
    redirect("/login");
  }
  return {
    gymId: u.gymId,
    userId: u.id,
    role: (u.role === "TRAINER" ? "TRAINER" : "OWNER") as Role,
  };
}

/**
 * Like requireSession() but throws 403 if the user is not the Owner.
 * Use on API routes that mutate money, billing, or staff (delete member,
 * delete plan, delete account, manage staff, etc.)
 */
export async function requireOwner(): Promise<SessionContext> {
  const ctx = await requireSession();
  if (ctx.role !== "OWNER") {
    throw new Error("FORBIDDEN");
  }
  return ctx;
}
