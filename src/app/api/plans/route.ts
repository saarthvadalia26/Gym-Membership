import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireGymId } from "@/lib/auth";

const createSchema = z.object({
  name: z.string().min(1).max(60),
  pricePaise: z.number().int().nonnegative(),
  durationDays: z.number().int().positive(),
});

export async function GET() {
  const gymId = await requireGymId();
  const plans = await prisma.plan.findMany({
    where: { gymId },
    orderBy: { durationDays: "asc" },
  });
  return NextResponse.json(plans);
}

export async function POST(req: NextRequest) {
  const gymId = await requireGymId();
  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const plan = await prisma.plan.create({ data: { ...parsed.data, gymId } });
  return NextResponse.json(plan, { status: 201 });
}
