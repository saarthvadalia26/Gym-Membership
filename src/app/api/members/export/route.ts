import { NextResponse } from "next/server";
import { format } from "date-fns";
import { prisma } from "@/lib/db";
import { requireGymId } from "@/lib/auth";
import { computeStatus } from "@/lib/status";

export const dynamic = "force-dynamic";

function csvEscape(value: string | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET() {
  const gymId = await requireGymId();
  const members = await prisma.member.findMany({
    where: { gymId },
    orderBy: { fullName: "asc" },
    include: {
      subscriptions: {
        orderBy: { endDate: "desc" },
        take: 1,
        include: { plan: true },
      },
    },
  });

  const headers = [
    "Full Name",
    "Phone Number",
    "Joined",
    "Emergency Contact",
    "Current Plan",
    "Subscription Start",
    "Subscription End",
    "Amount Paid (INR)",
    "Status",
  ];

  const rows = members.map((m) => {
    const sub = m.subscriptions[0];
    const status = sub ? computeStatus(sub.endDate) : "—";
    return [
      csvEscape(m.fullName),
      csvEscape(m.phoneNumber),
      csvEscape(format(m.joinDate, "yyyy-MM-dd")),
      csvEscape(m.emergencyContact),
      csvEscape(sub?.plan.name),
      csvEscape(sub ? format(sub.startDate, "yyyy-MM-dd") : ""),
      csvEscape(sub ? format(sub.endDate, "yyyy-MM-dd") : ""),
      csvEscape(sub ? (sub.pricePaidPaise / 100).toFixed(2) : ""),
      csvEscape(status),
    ].join(",");
  });

  const csv = [headers.join(","), ...rows].join("\n");
  const filename = `members-${format(new Date(), "yyyy-MM-dd")}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
