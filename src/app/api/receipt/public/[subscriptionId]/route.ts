import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { renderReceiptPdf, buildReceiptNumber } from "@/lib/pdf";

export const runtime = "nodejs";

/**
 * Public receipt download — auth via the member's access token (?token=...).
 * Used by the member portal at /m/[token]. The token must belong to the
 * member who owns the subscription.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ subscriptionId: string }> }
) {
  const { subscriptionId } = await params;
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 401 });
  }

  const member = await prisma.member.findUnique({
    where: { accessToken: token },
    select: { id: true },
  });
  if (!member) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const sub = await prisma.subscription.findFirst({
    where: { id: subscriptionId, memberId: member.id },
    include: { member: true, plan: true, gym: true },
  });
  if (!sub) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const receiptNumber = buildReceiptNumber(sub.id, sub.createdAt);

  const pdfBuffer = await renderReceiptPdf({
    receiptNumber,
    issuedAt: sub.createdAt,
    memberName: sub.member.fullName,
    memberPhone: sub.member.phoneNumber,
    planName: sub.plan.name,
    startDate: sub.startDate,
    endDate: sub.endDate,
    durationDays: sub.plan.durationDays,
    pricePaidPaise: sub.pricePaidPaise,
    gymName: sub.gym.name,
    gymAddress: sub.gym.address ?? "",
    gymPhone: sub.gym.phone ?? "",
  });

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${receiptNumber}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
