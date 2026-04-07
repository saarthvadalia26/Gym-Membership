import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const registerSchema = z.object({
  gymName: z.string().min(2, "Gym name is required").max(120),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters").max(200),
  address: z.string().max(240).optional().or(z.literal("")),
  phone: z.string().max(40).optional().or(z.literal("")),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    const firstError =
      Object.values(flat.fieldErrors).flat()[0] ??
      flat.formErrors[0] ??
      "Invalid input";
    return NextResponse.json({ error: firstError }, { status: 400 });
  }

  const { gymName, email, password, address, phone } = parsed.data;

  // Check if email is already registered (across all gyms — emails are global)
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists" },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);

  // Create gym + owner user + 3 default plans in one transaction so a partial
  // signup never leaves orphan rows.
  const gym = await prisma.$transaction(async (tx) => {
    const newGym = await tx.gym.create({
      data: {
        name: gymName,
        address: address || null,
        phone: phone || null,
      },
    });

    await tx.user.create({
      data: {
        email,
        passwordHash,
        gymId: newGym.id,
      },
    });

    // Seed each new gym with the same starter plans
    await tx.plan.createMany({
      data: [
        { gymId: newGym.id, name: "Monthly", pricePaise: 150000, durationDays: 30 },
        { gymId: newGym.id, name: "Quarterly", pricePaise: 400000, durationDays: 90 },
        { gymId: newGym.id, name: "Yearly", pricePaise: 1400000, durationDays: 365 },
      ],
    });

    return newGym;
  });

  return NextResponse.json(
    { ok: true, gymId: gym.id, gymName: gym.name },
    { status: 201 }
  );
}
