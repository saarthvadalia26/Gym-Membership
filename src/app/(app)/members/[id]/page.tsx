import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Calendar,
  Phone,
  AlertCircle,
  Activity,
  Cake,
} from "lucide-react";
import { differenceInYears, format } from "date-fns";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { computeStatus, daysRemaining } from "@/lib/status";
import { formatINR } from "@/lib/currency";
import { buildWhatsAppReceiptLink } from "@/lib/whatsapp";
import { StatusBadge } from "@/components/StatusBadge";
import { ReceiptActions } from "@/components/ReceiptActions";
import { DeleteMemberButton } from "@/components/DeleteMemberButton";
import { CheckinSparkline } from "@/components/CheckinSparkline";
import { MemberPortalShare } from "@/components/MemberPortalShare";
import { MemberQRCode } from "@/components/MemberQRCode";
import { ReferralCodeCard } from "@/components/ReferralCodeCard";

export const dynamic = "force-dynamic";

export default async function MemberDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ receipt?: string }>;
}) {
  const ctx = await requireSession();
  const gym = await prisma.gym.findUniqueOrThrow({ where: { id: ctx.gymId } });
  const isOwner = ctx.role === "OWNER";
  const { id } = await params;
  const { receipt } = await searchParams;

  const member = await prisma.member.findFirst({
    where: { id, gymId: ctx.gymId },
    include: {
      subscriptions: {
        orderBy: { startDate: "desc" },
        include: { plan: true },
      },
      checkIns: {
        orderBy: { timestamp: "desc" },
        take: 60,
      },
      referredBy: {
        select: { id: true, fullName: true },
      },
      _count: {
        select: { referrals: true },
      },
    },
  });

  if (!member) notFound();

  const latestSub = member.subscriptions[0] ?? null;
  const status = latestSub ? computeStatus(latestSub.endDate) : null;
  const remaining = latestSub ? daysRemaining(latestSub.endDate) : null;

  const receiptSub = receipt
    ? member.subscriptions.find((s) => s.id === receipt)
    : null;

  const whatsappUrl = receiptSub
    ? buildWhatsAppReceiptLink({
        memberName: member.fullName,
        memberPhone: member.phoneNumber,
        planName: receiptSub.plan.name,
        endDate: receiptSub.endDate,
        pricePaidPaise: receiptSub.pricePaidPaise,
        gymName: gym.name,
      })
    : "";

  const initials = member.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const totalSpent = member.subscriptions.reduce(
    (acc, s) => acc + s.pricePaidPaise,
    0
  );

  return (
    <div className="animate-fade-in">
      <Link
        href="/members"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 mb-4 transition"
      >
        <ArrowLeft size={14} /> Back to members
      </Link>

      {receiptSub && (
        <ReceiptActions subscriptionId={receiptSub.id} whatsappUrl={whatsappUrl} />
      )}

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-soft p-6 mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-brand-100 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 flex items-center justify-center font-bold text-lg shrink-0">
              {initials}
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                {member.fullName}
              </h1>
              <div className="flex items-center gap-4 mt-1.5 text-sm text-slate-500 dark:text-slate-400 flex-wrap">
                <span className="inline-flex items-center gap-1.5">
                  <Phone size={13} />
                  {member.phoneNumber}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Calendar size={13} />
                  Joined {format(member.joinDate, "dd MMM yyyy")}
                </span>
                {member.dateOfBirth && (
                  <span className="inline-flex items-center gap-1.5">
                    <Cake size={13} />
                    {format(member.dateOfBirth, "dd MMM")} (age{" "}
                    {differenceInYears(new Date(), member.dateOfBirth)})
                  </span>
                )}
              </div>
            </div>
          </div>
          {isOwner && (
            <div className="flex items-center gap-3">
              <DeleteMemberButton
                memberId={member.id}
                memberName={member.fullName}
              />
              <Link
                href={`/subscriptions/new?memberId=${member.id}`}
                className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 hover:shadow-glow text-white font-medium px-4 py-2.5 rounded-lg transition shadow-sm"
              >
                <Plus size={16} />
                {latestSub ? "Renew" : "New Subscription"}
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-soft p-6">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">
              Current Subscription
            </h2>
            {latestSub ? (
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                      {latestSub.plan.name}
                    </div>
                    {status && <StatusBadge status={status} />}
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
                    {format(latestSub.startDate, "dd MMM yyyy")} →{" "}
                    {format(latestSub.endDate, "dd MMM yyyy")}
                  </div>
                  {remaining !== null && remaining >= 0 && (
                    <div className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                      {remaining} days remaining
                    </div>
                  )}
                  {remaining !== null && remaining < 0 && (
                    <div className="text-sm text-red-600 dark:text-red-400 mt-1 inline-flex items-center gap-1">
                      <AlertCircle size={13} /> Expired {Math.abs(remaining)} days ago
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Paid
                  </div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                    {formatINR(latestSub.pricePaidPaise)}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-slate-400 dark:text-slate-500 py-6 text-center">
                No subscriptions yet.
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-soft p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Subscription History
              </h2>
              {totalSpent > 0 && (
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Lifetime value:{" "}
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {formatINR(totalSpent)}
                  </span>
                </div>
              )}
            </div>
            {member.subscriptions.length === 0 && (
              <div className="text-slate-400 dark:text-slate-500 text-sm py-4 text-center">
                No history yet.
              </div>
            )}
            {member.subscriptions.length > 0 && (
              <table className="w-full text-sm">
                <thead className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="text-left py-2 font-semibold">Plan</th>
                    <th className="text-left py-2 font-semibold">Start</th>
                    <th className="text-left py-2 font-semibold">End</th>
                    <th className="text-right py-2 font-semibold">Amount</th>
                    <th className="text-right py-2 font-semibold">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {member.subscriptions.map((s) => (
                    <tr key={s.id}>
                      <td className="py-2.5 text-slate-900 dark:text-slate-100">
                        {s.plan.name}
                      </td>
                      <td className="py-2.5 text-slate-600 dark:text-slate-400">
                        {format(s.startDate, "dd MMM yyyy")}
                      </td>
                      <td className="py-2.5 text-slate-600 dark:text-slate-400">
                        {format(s.endDate, "dd MMM yyyy")}
                      </td>
                      <td className="py-2.5 text-right font-semibold text-slate-900 dark:text-slate-100">
                        {formatINR(s.pricePaidPaise)}
                      </td>
                      <td className="py-2.5 text-right">
                        <a
                          href={`/api/receipt/${s.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand-600 dark:text-brand-400 hover:underline text-xs font-semibold"
                        >
                          PDF
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-soft p-6">
            <div className="flex items-center gap-2 mb-4">
              <Activity size={14} className="text-brand-500" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Check-in Activity
              </h2>
            </div>
            <CheckinSparkline checkIns={member.checkIns} />
          </div>

          <MemberPortalShare
            memberId={member.id}
            memberName={member.fullName}
            memberPhone={member.phoneNumber}
            initialAccessToken={member.accessToken}
            gymName={gym.name}
            qrCode={
              member.accessToken ? (
                <MemberQRCode token={member.accessToken} size={180} />
              ) : null
            }
          />

          <ReferralCodeCard
            referralCode={member.referralCode}
            referralCount={member._count.referrals}
            referredBy={member.referredBy}
          />

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-soft p-6">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">
              Member Info
            </h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-slate-500 dark:text-slate-400">Joined</dt>
                <dd className="text-slate-900 dark:text-slate-100 font-medium">
                  {format(member.joinDate, "dd MMM yyyy")}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500 dark:text-slate-400">Emergency Contact</dt>
                <dd className="text-slate-900 dark:text-slate-100 font-medium">
                  {member.emergencyContact || "—"}
                </dd>
              </div>
            </dl>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-soft p-6">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">
              Recent Check-ins
            </h2>
            {member.checkIns.length === 0 && (
              <div className="text-slate-400 dark:text-slate-500 text-sm py-4 text-center">
                No check-ins recorded.
              </div>
            )}
            {member.checkIns.length > 0 && (
              <ul className="space-y-2 text-sm max-h-64 overflow-y-auto">
                {member.checkIns.slice(0, 12).map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between gap-2"
                  >
                    <span className="text-slate-700 dark:text-slate-300">
                      {format(c.timestamp, "dd MMM, hh:mm a")}
                    </span>
                    <span
                      className={
                        c.allowed
                          ? "text-emerald-600 dark:text-emerald-400 text-xs font-semibold"
                          : "text-red-600 dark:text-red-400 text-xs font-semibold"
                      }
                    >
                      {c.allowed ? "ALLOWED" : "DENIED"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
