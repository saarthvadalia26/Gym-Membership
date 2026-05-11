import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireGymId } from "@/lib/auth";
import { computeStatus } from "@/lib/status";

export const runtime = "nodejs";

const schema = z.object({ token: z.string().min(1) });

/**
 * Check-in via QR code. The request must come from a logged-in gym admin
 * (so we know which gym is checking in), and the token must belong to a
 * member of THAT gym — no cross-tenant scanning.
 */
export async function POST(req: NextRequest) {
  const gymId = await requireGymId();
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const member = await prisma.member.findUnique({
    where: { accessToken: parsed.data.token.trim() },
    include: {
      subscriptions: {
        orderBy: { endDate: "desc" },
        take: 1,
        include: { plan: true },
      },
    },
  });

  if (!member || member.gymId !== gymId) {
    return NextResponse.json(
      { error: "QR code is not from this gym, or the member was deleted" },
      { status: 404 }
    );
  }

  const latest = member.subscriptions[0];
  const status = latest ? computeStatus(latest.endDate) : "RED";
  const allowed = status !== "RED";

  // Fire-and-forget: log the check-in without blocking the response
  prisma.checkIn.create({
    data: { gymId, memberId: member.id, allowed },
  }).catch(console.error);

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
