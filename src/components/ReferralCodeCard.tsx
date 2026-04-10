"use client";

import { toast } from "sonner";
import { Gift, Copy, Users } from "lucide-react";
import Link from "next/link";

interface Props {
  referralCode: string | null;
  referralCount: number;
  referredBy: { id: string; fullName: string } | null;
  creditsAvailable?: number;
}

export function ReferralCodeCard({
  referralCode,
  referralCount,
  referredBy,
  creditsAvailable = 0,
}: Props) {
  function copyCode() {
    if (!referralCode) return;
    navigator.clipboard.writeText(referralCode);
    toast.success("Referral code copied");
  }

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-soft p-6">
      <div className="flex items-center gap-2 mb-4">
        <Gift size={14} className="text-brand-500" />
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Referrals
        </h2>
      </div>

      {referralCode ? (
        <button
          onClick={copyCode}
          className="w-full flex items-center justify-between gap-2 px-3.5 py-3 rounded-xl bg-gradient-to-br from-brand-950/40 to-slate-800/40 border border-brand-800 hover:shadow-glow transition group"
        >
          <div className="text-left min-w-0">
            <div className="text-xs text-slate-400 mb-0.5">
              Referral code
            </div>
            <div className="font-mono font-bold text-lg text-brand-300 tracking-wider truncate">
              {referralCode}
            </div>
          </div>
          <Copy
            size={16}
            className="text-slate-400 group-hover:text-brand-400 transition shrink-0"
          />
        </button>
      ) : (
        <div className="px-3.5 py-3 rounded-xl bg-slate-800/40 text-sm text-slate-400">
          No referral code yet — will be generated automatically.
        </div>
      )}

      {creditsAvailable > 0 && (
        <div className="mt-4 px-3.5 py-3 rounded-xl bg-emerald-950/40 border border-emerald-200">
          <div className="flex items-center gap-2 text-emerald-800">
            <Gift size={14} />
            <span className="text-xs font-semibold uppercase tracking-wider">
              Reward unlocked
            </span>
          </div>
          <div className="text-sm text-emerald-200 mt-1.5 leading-relaxed">
            <strong>10% off</strong> on next subscription
            {creditsAvailable > 1 ? ` (${creditsAvailable} credits)` : ""} —
            applied automatically at checkout.
          </div>
        </div>
      )}

      <dl className="space-y-3 text-sm mt-4">
        <div className="flex items-center justify-between">
          <dt className="text-slate-400 inline-flex items-center gap-1.5">
            <Users size={13} />
            People referred
          </dt>
          <dd className="font-bold text-slate-100">
            {referralCount}
          </dd>
        </div>
        {referredBy && (
          <div className="flex items-center justify-between gap-2">
            <dt className="text-slate-400 shrink-0">
              Referred by
            </dt>
            <dd className="min-w-0">
              <Link
                href={`/members/${referredBy.id}`}
                className="font-semibold text-brand-400 hover:underline truncate block"
              >
                {referredBy.fullName}
              </Link>
            </dd>
          </div>
        )}
      </dl>
    </div>
  );
}
