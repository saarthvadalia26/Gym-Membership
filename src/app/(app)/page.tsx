import Link from "next/link";
import { format, startOfMonth, endOfMonth, subMonths, addDays } from "date-fns";
import { MessageCircle } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireGymId } from "@/lib/auth";
import { computeStatus, daysRemaining, Status } from "@/lib/status";
import { buildWhatsAppReminderLink } from "@/lib/whatsapp";
import { StatsCards } from "@/components/StatsCards";
import { StatusBadge } from "@/components/StatusBadge";
import { CollectionsChart } from "@/components/CollectionsChart";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  name: string;
  phone: string;
  plan: string;
  endDate: Date;
  days: number;
  pricePaise: number;
};

export default async function DashboardPage() {
  const gymId = await requireGymId();
  const gym = await prisma.gym.findUniqueOrThrow({ where: { id: gymId } });
  const today = new Date();

  const members = await prisma.member.findMany({
    where: { gymId },
    include: {
      subscriptions: {
        orderBy: { endDate: "desc" },
        take: 1,
        include: { plan: true },
      },
    },
  });

  const buckets: Record<Status, Row[]> = { RED: [], YELLOW: [], GREEN: [] };

  for (const m of members) {
    const sub = m.subscriptions[0];
    if (!sub) continue;
    const status = computeStatus(sub.endDate, today);
    const days = daysRemaining(sub.endDate, today);
    buckets[status].push({
      id: m.id,
      name: m.fullName,
      phone: m.phoneNumber,
      plan: sub.plan.name,
      endDate: sub.endDate,
      days,
      pricePaise: sub.pricePaidPaise,
    });
  }

  buckets.RED.sort((a, b) => a.days - b.days);
  buckets.YELLOW.sort((a, b) => a.days - b.days);
  buckets.GREEN.sort((a, b) => a.days - b.days);

  // Top-line stats
  const totalMembers = await prisma.member.count({ where: { gymId } });

  const activeSubs = await prisma.subscription.findMany({
    where: { gymId, endDate: { gte: today } },
    include: { plan: true },
  });
  const mrrPaise = activeSubs.reduce((acc, s) => {
    if (s.plan.durationDays <= 0) return acc;
    return acc + Math.round((s.pricePaidPaise / s.plan.durationDays) * 30);
  }, 0);

  const expiringThisWeek = buckets.YELLOW.length;

  const in30 = addDays(today, 30);
  const expectedNext30 = await prisma.subscription.findMany({
    where: { gymId, endDate: { gte: today, lte: in30 } },
  });
  const expectedNext30DaysPaise = expectedNext30.reduce(
    (acc, s) => acc + s.pricePaidPaise,
    0
  );

  // Collections chart — last 6 months actual + forecast for "Next 30d"
  const sixMonthsAgo = startOfMonth(subMonths(today, 5));
  const recentSubs = await prisma.subscription.findMany({
    where: { gymId, createdAt: { gte: sixMonthsAgo } },
    select: { createdAt: true, pricePaidPaise: true },
  });

  const monthly: { label: string; paise: number; isForecast?: boolean }[] = [];
  for (let i = 5; i >= 0; i--) {
    const monthStart = startOfMonth(subMonths(today, i));
    const monthEnd = endOfMonth(monthStart);
    const total = recentSubs
      .filter((s) => s.createdAt >= monthStart && s.createdAt <= monthEnd)
      .reduce((acc, s) => acc + s.pricePaidPaise, 0);
    monthly.push({ label: format(monthStart, "MMM"), paise: total });
  }
  monthly.push({
    label: "Next 30d",
    paise: expectedNext30DaysPaise,
    isForecast: true,
  });

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Dashboard
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
          {format(today, "EEEE, dd MMMM yyyy")}
        </p>
      </div>

      <div className="mb-6">
        <StatsCards
          stats={{
            totalMembers,
            mrrPaise,
            expiringThisWeek,
            expectedNext30DaysPaise,
          }}
        />
      </div>

      <div className="mb-8">
        <CollectionsChart data={monthly} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Column
          title="Expired / Overdue"
          status="RED"
          rows={buckets.RED}
          emptyText="No expired members. 🎉"
          gymName={gym.name}
        />
        <Column
          title="Expiring Soon (≤5 days)"
          status="YELLOW"
          rows={buckets.YELLOW}
          emptyText="No renewals due this week."
          gymName={gym.name}
        />
        <Column
          title="Active"
          status="GREEN"
          rows={buckets.GREEN}
          emptyText="No active members yet."
          gymName={gym.name}
        />
      </div>
    </div>
  );
}

function Column({
  title,
  status,
  rows,
  emptyText,
  gymName,
}: {
  title: string;
  status: Status;
  rows: Row[];
  emptyText: string;
  gymName: string;
}) {
  const headerStyle =
    status === "RED"
      ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900"
      : status === "YELLOW"
      ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900"
      : "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900";

  const accentBar =
    status === "RED"
      ? "bg-red-500"
      : status === "YELLOW"
      ? "bg-amber-500"
      : "bg-emerald-500";

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-soft overflow-hidden flex flex-col">
      <div className={`px-5 py-3.5 border-b ${headerStyle} relative`}>
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${accentBar}`} />
        <div className="flex items-center justify-between pl-2">
          <h2 className="font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
          <span className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-full bg-white/80 dark:bg-slate-800/80 text-sm font-bold text-slate-700 dark:text-slate-200 shadow-sm">
            {rows.length}
          </span>
        </div>
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[640px] overflow-y-auto flex-1">
        {rows.length === 0 && (
          <div className="px-5 py-10 text-sm text-center text-slate-400 dark:text-slate-500">
            {emptyText}
          </div>
        )}
        {rows.map((r) => (
          <div
            key={r.id}
            className="group px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition relative"
          >
            <Link href={`/members/${r.id}`} className="block">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-slate-900 dark:text-slate-100 truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition">
                    {r.name}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {r.plan} • ends {format(r.endDate, "dd MMM")}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <StatusBadge status={status} />
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {r.days < 0
                      ? `${Math.abs(r.days)}d ago`
                      : r.days === 0
                      ? "today"
                      : `${r.days}d left`}
                  </div>
                </div>
              </div>
            </Link>
            {status === "RED" && (
              <a
                href={buildWhatsAppReminderLink({
                  memberName: r.name,
                  memberPhone: r.phone,
                  planName: r.plan,
                  endDate: r.endDate,
                  daysOverdue: Math.abs(r.days),
                  gymName: gymName,
                })}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-full transition"
                title="Send WhatsApp renewal reminder"
              >
                <MessageCircle size={12} />
                Send Reminder
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
