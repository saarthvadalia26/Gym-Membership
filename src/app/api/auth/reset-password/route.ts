import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

function hashToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const firstError =
      Object.values(parsed.error.flatten().fieldErrors).flat()[0] ??
      "Invalid input";
    return NextResponse.json({ error: firstError }, { status: 400 });
  }

  const { token: rawToken, password } = parsed.data;
  const tokenHash = hashToken(rawToken);

  const record = await prisma.passwordResetToken.findUnique({
    where: { token: tokenHash },
    include: { user: true },
  });

  if (!record) {
    return NextResponse.json(
      { error: "Reset link is invalid" },
      { status: 400 }
    );
  }
  if (record.usedAt) {
    return NextResponse.json(
      { error: "Reset link has already been used" },
      { status: 400 }
    );
  }
  if (record.expiresAt < new Date()) {
    return NextResponse.json(
      { error: "Reset link has expired. Request a new one." },
      { status: 400 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    // Invalidate any other outstanding reset tokens for this user
    prisma.passwordResetToken.updateMany({
      where: { userId: record.userId, usedAt: null, id: { not: record.id } },
      data: { usedAt: new Date() },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
