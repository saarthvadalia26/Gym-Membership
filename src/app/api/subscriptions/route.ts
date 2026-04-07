import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { addDays } from "date-fns";
import { prisma } from "@/lib/db";
import { requireGymId } from "@/lib/auth";

const createSchema = z.object({
  memberId: z.string().min(1),
  planId: z.string().min(1),
  startDate: z.string().min(1),
  pricePaidPaise: z.number().int().nonnegative(),
});

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
  const { memberId, planId, startDate, pricePaidPaise } = parsed.data;

  // Both must belong to the caller's gym — never allow cross-tenant linking
  const plan = await prisma.plan.findFirst({ where: { id: planId, gymId } });
  if (!plan) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  const member = await prisma.member.findFirst({ where: { id: memberId, gymId } });
  if (!member) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  const start = new Date(startDate);
  const end = addDays(start, plan.durationDays);

  const subscription = await prisma.subscription.create({
    data: {
      gymId,
      memberId,
      planId,
      startDate: start,
      endDate: end,
      pricePaidPaise,
      status: "Active",
    },
  });

  return NextResponse.json(subscription, { status: 201 });
}
