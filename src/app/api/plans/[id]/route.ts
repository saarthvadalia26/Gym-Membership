import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireGymId } from "@/lib/auth";

const updateSchema = z.object({
  name: z.string().min(1).max(60).optional(),
  pricePaise: z.number().int().nonnegative().optional(),
  durationDays: z.number().int().positive().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const gymId = await requireGymId();
  const { id } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const existing = await prisma.plan.findFirst({ where: { id, gymId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const plan = await prisma.plan.update({ where: { id }, data: parsed.data });
  return NextResponse.json(plan);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const gymId = await requireGymId();
  const { id } = await params;

  // Scoped existence check
  const existing = await prisma.plan.findFirst({ where: { id, gymId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Block deletion if any subscription references this plan — preserves history.
  const inUse = await prisma.subscription.count({ where: { planId: id, gymId } });
  if (inUse > 0) {
    return NextResponse.json(
      { error: "Cannot delete a plan that has subscriptions. Edit it instead." },
      { status: 409 }
    );
  }
  await prisma.plan.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
