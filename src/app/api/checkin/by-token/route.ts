import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { computeStatus } from "@/lib/status";

export const runtime = "nodejs";

const schema = z.object({ token: z.string().min(1) });

/**
 * Check-in via QR code. Always returns JSON — never redirects.
 * Using auth() directly instead of requireGymId() because requireGymId()
 * calls redirect("/login") on auth failure, which returns HTML (not JSON)
 * and breaks the client-side fetch error handler.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  const gymId = (session?.user as { gymId?: string } | undefined)?.gymId;
  if (!gymId) {
    return NextResponse.json(
      { error: "Not authenticated — please log in again." },
      { status: 401 }
    );
  }

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
