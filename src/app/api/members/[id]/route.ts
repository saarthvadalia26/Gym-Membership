import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireGymId, requireOwner } from "@/lib/auth";

const updateSchema = z.object({
  fullName: z.string().min(1).max(120).optional(),
  phoneNumber: z.string().min(7).max(20).optional(),
  emergencyContact: z.string().max(120).nullable().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const gymId = await requireGymId();
  const { id } = await params;
  const member = await prisma.member.findFirst({
    where: { id, gymId },
    include: {
      subscriptions: {
        orderBy: { startDate: "desc" },
        include: { plan: true },
      },
      checkIns: {
        orderBy: { timestamp: "desc" },
        take: 20,
      },
    },
  });
  if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(member);
}

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

  // Verify the member belongs to this gym before updating
  const existing = await prisma.member.findFirst({ where: { id, gymId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const member = await prisma.member.update({
    where: { id },
    data: parsed.data,
  });
  return NextResponse.json(member);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireOwner();
    const { id } = await params;
    const result = await prisma.member.deleteMany({
      where: { id, gymId: ctx.gymId },
    });
    if (result.count === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") {
      return NextResponse.json(
        { error: "Only the owner can delete members" },
        { status: 403 }
      );
    }
    throw e;
  }
}
