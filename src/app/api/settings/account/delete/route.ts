import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";

const schema = z.object({
  password: z.string().min(1, "Password is required"),
  confirmGymName: z.string().min(1, "Type the gym name to confirm"),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  const gymId = (session?.user as { gymId?: string } | undefined)?.gymId;
  if (!userId || !gymId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const firstError =
      Object.values(parsed.error.flatten().fieldErrors).flat()[0] ??
      "Invalid input";
    return NextResponse.json({ error: firstError }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: "Password is incorrect" }, { status: 403 });
  }

  const gym = await prisma.gym.findUnique({ where: { id: gymId } });
  if (!gym) {
    return NextResponse.json({ error: "Gym not found" }, { status: 404 });
  }

  // Type-to-confirm safety check (case-insensitive, trimmed)
  if (
    parsed.data.confirmGymName.trim().toLowerCase() !==
    gym.name.trim().toLowerCase()
  ) {
    return NextResponse.json(
      { error: "Gym name does not match — deletion cancelled" },
      { status: 400 }
    );
  }

  // Cascade delete: removing the Gym row drops User, Members, Plans, Subscriptions,
  // CheckIns belonging to it (via ON DELETE CASCADE in the schema).
  await prisma.gym.delete({ where: { id: gymId } });

  return NextResponse.json({ ok: true });
}
