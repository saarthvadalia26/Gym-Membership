import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { SubscriptionForm } from "@/components/SubscriptionForm";

export const dynamic = "force-dynamic";

export default async function NewSubscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ memberId?: string }>;
}) {
  const ctx = await requireSession();
  const { memberId } = await searchParams;
  if (!memberId) notFound();

  if (ctx.role !== "OWNER") {
    redirect(`/members/${memberId}`);
  }

  const member = await prisma.member.findFirst({ where: { id: memberId, gymId: ctx.gymId } });
  if (!member) notFound();

  const plans = await prisma.plan.findMany({
    where: { gymId: ctx.gymId },
    orderBy: { durationDays: "asc" },
  });

  return (
    <div className="animate-fade-in">
      <Link
        href={`/members/${memberId}`}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 mb-4 transition"
      >
        <ArrowLeft size={14} /> Back to {member.fullName}
      </Link>
      <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-6 tracking-tight">
        New Subscription
      </h1>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-soft p-6">
        <SubscriptionForm
          memberId={member.id}
          memberName={member.fullName}
          plans={plans}
          referralCreditsAvailable={member.referralCreditsAvailable}
        />
      </div>
    </div>
  );
}
