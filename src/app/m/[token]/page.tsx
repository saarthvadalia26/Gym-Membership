import { notFound } from "next/navigation";
import Image from "next/image";
import { format } from "date-fns";
import {
  Calendar,
  Phone,
  CheckCircle2,
  AlertCircle,
  Clock,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { computeStatus, daysRemaining } from "@/lib/status";
import { formatINR } from "@/lib/currency";
import { StatusBadge } from "@/components/StatusBadge";
import { CheckinSparkline } from "@/components/CheckinSparkline";
import { MemberQRCode } from "@/components/MemberQRCode";

export const dynamic = "force-dynamic";

/**
 * Public member portal — accessible by anyone with the unique access token.
 * No login required. The token is the auth.
 */
export default async function MemberPortalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const member = await prisma.member.findUnique({
    where: { accessToken: token },
    include: {
      gym: {
        select: { name: true, address: true, phone: true },
      },
      subscriptions: {
        orderBy: { startDate: "desc" },
        include: { plan: true },
      },
      checkIns: {
        orderBy: { timestamp: "desc" },
        take: 60,
      },
    },
  });

  if (!member) notFound();

  const latestSub = member.subscriptions[0] ?? null;
  const status = latestSub ? computeStatus(latestSub.endDate) : null;
  const remaining = latestSub ? daysRemaining(latestSub.endDate) : null;

  const totalSpent = member.subscriptions.reduce(
    (acc, s) => acc + s.pricePaidPaise,
    0
  );

  const initials = member.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-brand-50/30 dark:from-[#0b1020] dark:via-[#0b1020] dark:to-[#1a1340]/40">
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12 animate-fade-in">
        {/* Gym header */}
        <div className="flex items-center gap-3 mb-8">
          <Image
            src="/logo.svg"
            alt={member.gym.name}
            width={44}
            height={44}
            className="rounded-xl shadow-glow shrink-0"
            priority
          />
          <div>
            <div className="font-bold text-slate-900 dark:text-slate-100">
              {member.gym.name}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Member Portal
            </div>
          </div>
        </div>

        {/* Member identity */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-soft p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-brand-100 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 flex items-center justify-center font-bold text-lg shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                {member.fullName}
              </h1>
              <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                <span className="inline-flex items-center gap-1">
                  <Phone size={11} />
                  {member.phoneNumber}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Calendar size={11} />
                  Member since {format(member.joinDate, "MMM yyyy")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Membership status — the big card */}
        {latestSub && status ? (
          <div
            className={`rounded-2xl border-2 p-6 mb-6 shadow-soft ${
              status === "GREEN"
                ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800"
                : status === "YELLOW"
                ? "bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800"
                : "bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-800"
            }`}
          >
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Current Plan
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                    {latestSub.plan.name}
                  </div>
                  <StatusBadge status={status} />
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                  Valid until <strong>{format(latestSub.endDate, "dd MMM yyyy")}</strong>
                </div>
                {remaining !== null && remaining > 0 && (
                  <div className="text-sm text-slate-600 dark:text-slate-400 mt-1 inline-flex items-center gap-1.5">
                    <Clock size={13} />
                    {remaining} days remaining
                  </div>
                )}
                {remaining !== null && remaining === 0 && (
                  <div className="text-sm text-amber-700 dark:text-amber-400 mt-1 font-semibold">
                    Expires today — please renew at the gym
                  </div>
                )}
                {remaining !== null && remaining < 0 && (
                  <div className="text-sm text-red-700 dark:text-red-400 mt-1 inline-flex items-center gap-1.5 font-semibold">
                    <AlertCircle size={13} />
                    Expired {Math.abs(remaining)} days ago — please renew
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 mb-6 text-center">
            <div className="text-slate-500 dark:text-slate-400">
              No active subscription. Visit the gym to sign up.
            </div>
          </div>
        )}

        {/* Check-in QR — the showpiece for the portal */}
        {member.accessToken && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-soft p-6 mb-6">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4 text-center">
              Your Check-in QR
            </h2>
            <div className="flex justify-center">
              <div className="bg-white p-3 rounded-2xl shadow-soft border border-slate-200">
                <MemberQRCode token={member.accessToken} size={220} />
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 text-center leading-relaxed">
              Show this at the front desk for instant check-in.
              <br />
              Tip: bookmark this page so it&apos;s always one tap away.
            </p>
          </div>
        )}

        {/* Activity */}
        {member.checkIns.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-soft p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 size={14} className="text-brand-500" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Your Check-ins
              </h2>
            </div>
            <CheckinSparkline checkIns={member.checkIns} />
          </div>
        )}

        {/* Payment history */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-soft p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Payment History
            </h2>
            {totalSpent > 0 && (
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Total paid:{" "}
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {formatINR(totalSpent)}
                </span>
              </div>
            )}
          </div>
          {member.subscriptions.length === 0 ? (
            <div className="text-sm text-slate-400 dark:text-slate-500 py-4 text-center">
              No payments recorded yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {member.subscriptions.map((s) => (
                <div
                  key={s.id}
                  className="py-3 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <div className="font-medium text-slate-900 dark:text-slate-100">
                      {s.plan.name}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {format(s.startDate, "dd MMM yyyy")} → {format(s.endDate, "dd MMM yyyy")}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold text-slate-900 dark:text-slate-100">
                      {formatINR(s.pricePaidPaise)}
                    </div>
                    <a
                      href={`/api/receipt/public/${s.id}?token=${token}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-brand-600 dark:text-brand-400 hover:underline font-semibold"
                    >
                      Download PDF
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Gym contact */}
        {(member.gym.address || member.gym.phone) && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-soft p-6 mb-6">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              Gym Contact
            </h2>
            {member.gym.address && (
              <div className="text-sm text-slate-700 dark:text-slate-300">
                {member.gym.address}
              </div>
            )}
            {member.gym.phone && (
              <a
                href={`tel:${member.gym.phone}`}
                className="text-sm text-brand-600 dark:text-brand-400 mt-1 inline-block hover:underline"
              >
                {member.gym.phone}
              </a>
            )}
          </div>
        )}

        <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-8">
          This is your private member page. Don&apos;t share the link.
        </p>
      </div>
    </div>
  );
}
