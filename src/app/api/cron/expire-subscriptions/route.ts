import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

/**
 * Nightly cron — flips Subscription.status to "Expired" for any active row
 * whose endDate has passed. Note: the dashboard derives status from endDate
 * directly, so this is bookkeeping that lets us query "all currently expired"
 * efficiently in future reports.
 *
 * Auth: Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`. Reject everything else.
 */
export async function POST(req: NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 500 }
    );
  }

  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await prisma.subscription.updateMany({
    where: {
      status: "Active",
      endDate: { lt: new Date() },
    },
    data: { status: "Expired" },
  });

  return NextResponse.json({
    expiredCount: result.count,
    ranAt: new Date().toISOString(),
  });
}

// Vercel Cron also makes a GET request when invoking — accept it for convenience.
export async function GET(req: NextRequest) {
  return POST(req);
}
