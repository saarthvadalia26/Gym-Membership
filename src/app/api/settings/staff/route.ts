import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { requireOwner } from "@/lib/auth";

export const runtime = "nodejs";

const createSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["TRAINER", "OWNER"]).default("TRAINER"),
});

export async function GET() {
  try {
    const ctx = await requireOwner();
    const staff = await prisma.user.findMany({
      where: { gymId: ctx.gymId },
      select: { id: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(staff);
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Owner only" }, { status: 403 });
    }
    throw e;
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireOwner();
    const body = await req.json().catch(() => null);
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      const firstError =
        Object.values(parsed.error.flatten().fieldErrors).flat()[0] ??
        "Invalid input";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { email, password, role } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        gymId: ctx.gymId,
        role,
      },
      select: { id: true, email: true, role: true, createdAt: true },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Owner only" }, { status: 403 });
    }
    throw e;
  }
}
