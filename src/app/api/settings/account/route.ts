import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

const updateSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newEmail: z.string().email("Invalid email").optional().or(z.literal("")),
    newPassword: z
      .string()
      .min(6, "New password must be at least 6 characters")
      .optional()
      .or(z.literal("")),
  })
  .refine(
    (data) => (data.newEmail && data.newEmail.length > 0) || (data.newPassword && data.newPassword.length > 0),
    { message: "Provide a new email or a new password" }
  );

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const userId = (session.user as { id?: string }).id;
  if (!userId) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    const firstError =
      Object.values(flat.fieldErrors).flat()[0] ??
      flat.formErrors[0] ??
      "Invalid input";
    return NextResponse.json({ error: firstError }, { status: 400 });
  }

  const { currentPassword, newEmail, newPassword } = parsed.data;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const ok = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 403 });
  }

  const updates: { email?: string; passwordHash?: string } = {};
  if (newEmail && newEmail.length > 0 && newEmail !== user.email) {
    // Make sure the new email isn't already taken
    const existing = await prisma.user.findUnique({ where: { email: newEmail } });
    if (existing && existing.id !== userId) {
      return NextResponse.json({ error: "Email is already in use" }, { status: 409 });
    }
    updates.email = newEmail;
  }
  if (newPassword && newPassword.length > 0) {
    updates.passwordHash = await bcrypt.hash(newPassword, 10);
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: userId },
    data: updates,
  });

  return NextResponse.json({
    ok: true,
    emailChanged: !!updates.email,
    passwordChanged: !!updates.passwordHash,
  });
}
