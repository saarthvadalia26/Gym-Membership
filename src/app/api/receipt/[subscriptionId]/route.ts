import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireGymId } from "@/lib/auth";
import { renderReceiptPdf, buildReceiptNumber } from "@/lib/pdf";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ subscriptionId: string }> }
) {
  const gymId = await requireGymId();
  const { subscriptionId } = await params;

  const sub = await prisma.subscription.findFirst({
    where: { id: subscriptionId, gymId },
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
