import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireGymId } from "@/lib/auth";
import { SubscriptionForm } from "@/components/SubscriptionForm";

export const dynamic = "force-dynamic";

export default async function NewSubscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ memberId?: string }>;
}) {
  const gymId = await requireGymId();
  const { memberId } = await searchParams;
  if (!memberId) notFound();

  const member = await prisma.member.findFirst({ where: { id: memberId, gymId } });
  if (!member) notFound();

  const plans = await prisma.plan.findMany({
    where: { gymId },
    orderBy: { durationDays: "asc" },
  });

  return (
    <div className="animate-fade-in">
      <Link
        href={`/members/${memberId}`}
        className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 mb-4 transition"
      >
        <ArrowLeft size={14} /> Back to {member.fullName}
      </Link>
      <h1 className="text-3xl font-bold text-slate-100 mb-6 tracking-tight">
        New Subscription
      </h1>
      <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-soft p-6">
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
