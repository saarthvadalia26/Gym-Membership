import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireGymId } from "@/lib/auth";
import { computeStatus } from "@/lib/status";

const schema = z.object({ memberId: z.string().min(1) });

export async function POST(req: NextRequest) {
  const gymId = await requireGymId();
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const member = await prisma.member.findFirst({
    where: { id: parsed.data.memberId, gymId },
    include: {
      subscriptions: {
        orderBy: { endDate: "desc" },
        take: 1,
        include: { plan: true },
      },
    },
  });

  if (!member) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  const latest = member.subscriptions[0];
  const status = latest ? computeStatus(latest.endDate) : "RED";
  const allowed = status !== "RED";

  await prisma.checkIn.create({
    data: { gymId, memberId: member.id, allowed },
  });

  return NextResponse.json({
    allowed,
    status,
    member: {
      id: member.id,
      fullName: member.fullName,
      phoneNumber: member.phoneNumber,
    },
    subscription: latest
      ? {
          planName: latest.plan.name,
          endDate: latest.endDate,
        }
      : null,
  });
}
