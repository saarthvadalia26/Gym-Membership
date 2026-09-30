import Link from "next/link";
import { format, startOfMonth, endOfMonth, subMonths, addDays } from "date-fns";
import { prisma } from "@/lib/db";
import { requireGymId } from "@/lib/auth";
import { computeStatus, daysRemaining, Status } from "@/lib/status";
import { StatsCards } from "@/components/StatsCards";
import { CollectionsChart } from "@/components/CollectionsChart";
import { BirthdaysToday } from "@/components/BirthdaysToday";
import { TopReferrers } from "@/components/TopReferrers";
import { DashboardColumns } from "@/components/DashboardColumns";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  name: string;
  phone: string;
  plan: string;
  endDate: string; // ISO string — safe to pass across server→client boundary
  days: number;
  pricePaise: number;
};

export default async function DashboardPage() {
  const gymId = await requireGymId();
  const today = new Date();

  // Fetch all data in parallel
  const [
    gym,
    members,
    totalMembers,
    activeSubs,
    expectedNext30,
    referrerCounts,
    recentSubs,
  ] = await Promise.all([
    prisma.gym.findUniqueOrThrow({ 
      where: { id: gymId },
      select: { name: true }
    }),
    prisma.member.findMany({
      where: { gymId },
      include: {
        subscriptions: {
          orderBy: { endDate: "desc" },
          take: 1,
          include: { plan: { select: { name: true } } },
        },
      },
    }),
    prisma.member.count({ where: { gymId } }),
    prisma.subscription.findMany({
      where: { gymId, endDate: { gte: today } },
      include: { plan: { select: { durationDays: true } } },
    }),
    prisma.subscription.findMany({
      where: { gymId, endDate: { gte: today, lte: addDays(today, 30) } },
      select: { pricePaidPaise: true },
    }),
    prisma.member.findMany({
      where: { gymId, referrals: { some: {} } },
      select: {
        id: true,
        fullName: true,
        referralCode: true,
        _count: { select: { referrals: true } },
      },
      orderBy: { referrals: { _count: "desc" } },
      take: 5,
    }),
    prisma.subscription.findMany({
      where: { gymId, createdAt: { gte: startOfMonth(subMonths(today, 5)) } },
      select: { createdAt: true, pricePaidPaise: true },
    }),
  ]);

  // Birthdays today
  const todayMonth = today.getMonth();
  const todayDay = today.getDate();
  const birthdaysToday = members
    .filter((m) => {
      if (!m.dateOfBirth) return false;
      const dob = new Date(m.dateOfBirth);
      return dob.getMonth() === todayMonth && dob.getDate() === todayDay;
    })
    .map((m) => ({
      id: m.id,
      fullName: m.fullName,
      phoneNumber: m.phoneNumber,
      dateOfBirth: (m.dateOfBirth as Date).toISOString(), // serialize for client boundary
    }));

  const buckets: Record<Status, Row[]> = { RED: [], YELLOW: [], GREEN: [] };

  for (const m of members) {
    const sub = m.subscriptions[0];
    if (!sub) {
      buckets.RED.push({
        id: m.id,
        name: m.fullName,
        phone: m.phoneNumber,
        plan: "No Subscription",
        endDate: m.joinDate.toISOString(),
        days: -1,
        pricePaise: 0,
      });
      continue;
    }
    const status = computeStatus(sub.endDate, today);
    const days = daysRemaining(sub.endDate, today);
    buckets[status].push({
      id: m.id,
      name: m.fullName,
      phone: m.phoneNumber,
      plan: sub.plan.name,
      endDate: sub.endDate.toISOString(), // serialize Date for client boundary
      days,
      pricePaise: sub.pricePaidPaise,
    });
  }

  buckets.RED.sort((a, b) => a.days - b.days);
  buckets.YELLOW.sort((a, b) => a.days - b.days);
  buckets.GREEN.sort((a, b) => a.days - b.days);

  const mrrPaise = activeSubs.reduce((acc, s) => {
    if (s.plan.durationDays <= 0) return acc;
    return acc + Math.round((s.pricePaidPaise / s.plan.durationDays) * 30);
  }, 0);

  const expiringThisWeek = buckets.YELLOW.length;

  const expectedNext30DaysPaise = expectedNext30.reduce(
    (acc, s) => acc + s.pricePaidPaise,
    0
  );

  const topReferrers = referrerCounts
    .map((r) => ({
      id: r.id,
      fullName: r.fullName,
      referralCode: r.referralCode,
      count: r._count.referrals,
    }))
    .sort((a, b) => b.count - a.count);

  // Collections chart
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
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-700">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Dashboard
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
          {format(today, "EEEE, dd MMMM yyyy")}
        </p>
      </div>

      <div className="mb-8">
        <StatsCards
          stats={{
            totalMembers,
            mrrPaise,
            expiringThisWeek,
            expectedNext30DaysPaise,
          }}
        />
      </div>

      <BirthdaysToday members={birthdaysToday} gymName={gym.name} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 items-stretch">
        <div className="lg:col-span-2">
          <CollectionsChart data={monthly} />
        </div>
        <TopReferrers referrers={topReferrers} />
      </div>

      <DashboardColumns buckets={buckets} gymName={gym.name} />
    </div>
  );
}

