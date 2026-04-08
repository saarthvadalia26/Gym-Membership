import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { addDays } from "date-fns";
import { prisma } from "@/lib/db";
import { requireOwner } from "@/lib/auth";
import { REFERRAL_DISCOUNT_PERCENT } from "@/lib/referral";

const createSchema = z.object({
  memberId: z.string().min(1),
  planId: z.string().min(1),
  startDate: z.string().min(1),
  pricePaidPaise: z.number().int().nonnegative(),
  applyReferralCredit: z.boolean().optional().default(false),
});

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireOwner();
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { memberId, planId, startDate, pricePaidPaise, applyReferralCredit } =
      parsed.data;

    const plan = await prisma.plan.findFirst({
      where: { id: planId, gymId: ctx.gymId },
    });
    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    const member = await prisma.member.findFirst({
      where: { id: memberId, gymId: ctx.gymId },
      select: {
        id: true,
        referredById: true,
        referralCreditsAvailable: true,
        _count: { select: { subscriptions: true } },
      },
    });
    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Validate referral credit usage server-side. The price paid must reflect
    // at least the 10% referral discount; we don't trust the client to compute
    // the right number.
    if (applyReferralCredit) {
      if (member.referralCreditsAvailable <= 0) {
        return NextResponse.json(
          { error: "No referral credits available for this member" },
          { status: 400 }
        );
      }
      const minDiscountPaise = Math.floor(
        (plan.pricePaise * REFERRAL_DISCOUNT_PERCENT) / 100
      );
      const maxAllowedPrice = plan.pricePaise - minDiscountPaise;
      if (pricePaidPaise > maxAllowedPrice) {
        return NextResponse.json(
          {
            error: `Price must reflect the ${REFERRAL_DISCOUNT_PERCENT}% referral discount`,
          },
          { status: 400 }
        );
      }
    }

    const start = new Date(startDate);
    const end = addDays(start, plan.durationDays);

    // Wrap the subscription create + credit bookkeeping in a single
    // transaction so partial failures don't leave dangling credits.
    const isFirstSubscription = member._count.subscriptions === 0;
    const subscription = await prisma.$transaction(async (tx) => {
      const sub = await tx.subscription.create({
        data: {
          gymId: ctx.gymId,
          memberId,
          planId,
          startDate: start,
          endDate: end,
          // Snapshot the plan's listed price at the time of sale, so receipts
          // and reports can show the original price even if the plan changes later.
          originalPricePaise: plan.pricePaise,
          pricePaidPaise,
          status: "Active",
        },
      });

      // Consume one credit if the user applied it.
      if (applyReferralCredit) {
        await tx.member.update({
          where: { id: memberId },
          data: { referralCreditsAvailable: { decrement: 1 } },
        });
      }

      // First-ever subscription for someone who was referred?
      // Reward the referrer with one credit toward their next renewal.
      if (isFirstSubscription && member.referredById) {
        await tx.member.update({
          where: { id: member.referredById },
          data: { referralCreditsAvailable: { increment: 1 } },
        });
      }

      return sub;
    });

    return NextResponse.json(subscription, { status: 201 });
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") {
      return NextResponse.json(
        { error: "Only the owner can record payments" },
        { status: 403 }
      );
    }
    throw e;
  }
}
