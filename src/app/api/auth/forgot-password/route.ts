import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";

export const runtime = "nodejs";

const schema = z.object({
  email: z.string().email("Invalid email"),
});

const TOKEN_TTL_MINUTES = 60;

function hashToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

function getBaseUrl(req: NextRequest): string {
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL.replace(/\/$/, "");
  }
  if (process.env.APP_URL) {
    return process.env.APP_URL.replace(/\/$/, "");
  }
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "localhost:3456";
  const proto = req.headers.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const safeHost = host.replace(/[^a-zA-Z0-9.:_-]/g, "");
  return `${proto}://${safeHost}`;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  // Always return the same response whether or not the email exists, so
  // we don't leak which emails have accounts (email enumeration attack).
  const successResponse = NextResponse.json({
    ok: true,
    message: "If an account exists for that email, we've sent a reset link.",
  });

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    include: { gym: { select: { name: true } } },
  });
  if (!user) return successResponse;

  // Generate the raw token (sent to user) and store only its hash in the DB.
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: { token: tokenHash, userId: user.id, expiresAt },
  });

  const resetUrl = `${getBaseUrl(req)}/reset-password?token=${rawToken}`;

  await sendPasswordResetEmail({
    to: user.email,
    resetUrl,
    gymName: user.gym.name,
  });

  return successResponse;
}
