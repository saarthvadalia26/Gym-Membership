"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { addDays, format } from "date-fns";
import { Tag, X, Gift } from "lucide-react";
import { formatINR, formatINRCompact, parseINR } from "@/lib/currency";

const REFERRAL_DISCOUNT_PERCENT = 10;

interface Plan {
  id: string;
  name: string;
  pricePaise: number;
  durationDays: number;
}

interface Props {
  memberId: string;
  memberName: string;
  plans: Plan[];
  referralCreditsAvailable?: number;
}

type DiscountMode = "percent" | "amount";

export function SubscriptionForm({
  memberId,
  memberName,
  plans,
  referralCreditsAvailable = 0,
}: Props) {
  const router = useRouter();
  const [planId, setPlanId] = useState(plans[0]?.id ?? "");
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const selectedPlan = plans.find((p) => p.id === planId);

  const [discountOpen, setDiscountOpen] = useState(false);
  const [discountMode, setDiscountMode] = useState<DiscountMode>("percent");
  const [discountValue, setDiscountValue] = useState("");

  // Auto-apply the referral credit if the member has one. The trainer can
  // toggle it off if the member would rather save it for next time.
  const hasReferralCredit = referralCreditsAvailable > 0;
  const [useReferralCredit, setUseReferralCredit] = useState(hasReferralCredit);

  const [submitting, setSubmitting] = useState(false);

  // Compute discount paise — referral discount stacks before manual discount.
  const planPaise = selectedPlan?.pricePaise ?? 0;
  const referralDiscountPaise =
    useReferralCredit && hasReferralCredit
      ? Math.floor((planPaise * REFERRAL_DISCOUNT_PERCENT) / 100)
      : 0;

  let manualDiscountPaise = 0;
  if (discountOpen && discountValue.trim() !== "") {
    const num = Number(discountValue);
    if (Number.isFinite(num) && num > 0) {
      const baseAfterReferral = Math.max(planPaise - referralDiscountPaise, 0);
      if (discountMode === "percent") {
        const pct = Math.min(num, 100);
        manualDiscountPaise = Math.round((baseAfterReferral * pct) / 100);
      } else {
        manualDiscountPaise = Math.min(
          Math.round(num * 100),
          baseAfterReferral
        );
      }
    }
  }

  const discountPaise = referralDiscountPaise + manualDiscountPaise;
  const finalPricePaise = Math.max(planPaise - discountPaise, 0);

  function onPlanChange(id: string) {
    setPlanId(id);
  }

  function clearDiscount() {
    setDiscountOpen(false);
    setDiscountValue("");
    setDiscountMode("percent");
  }

  const previewEnd = selectedPlan
    ? addDays(new Date(startDate), selectedPlan.durationDays)
    : null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!selectedPlan) {
      toast.error("Select a plan");
      return;
    }
    if (finalPricePaise < 0 || !Number.isFinite(finalPricePaise)) {
      toast.error("Invalid amount");
      return;
    }

    setSubmitting(true);
    const res = await fetch("/api/subscriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        memberId,
        planId,
        startDate,
        pricePaidPaise: finalPricePaise,
        applyReferralCredit: useReferralCredit && hasReferralCredit,
      }),
    });

    if (!res.ok) {
      toast.error("Could not create subscription");
      setSubmitting(false);
      return;
    }
    const sub = await res.json();
    toast.success("Subscription created");
    router.push(`/members/${memberId}?receipt=${sub.id}`);
    router.refresh();
  }

  if (plans.length === 0) {
    return (
      <div className="rounded-xl bg-amber-950/40 border border-amber-800 p-5 text-amber-800">
        You haven&apos;t created any plans yet.{" "}
        <a href="/plans" className="font-semibold underline">
          Create a plan first
        </a>
        .
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">
          Member
        </label>
        <div className="px-3.5 py-2.5 bg-slate-800 rounded-lg text-slate-200 font-medium">
          {memberName}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">
          Plan
        </label>
        <select
          value={planId}
          onChange={(e) => onPlanChange(e.target.value)}
          className="w-full px-3.5 py-2.5 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400/50 focus:border-brand-400 transition bg-slate-900 text-slate-100"
        >
          {plans.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} — {formatINRCompact(p.pricePaise)} ({p.durationDays} days)
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">
          Start Date
        </label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="w-full px-3.5 py-2.5 border border-slate-700 bg-slate-900 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400/50 focus:border-brand-400 transition"
        />
      </div>

      {/* Pricing summary card */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-sm font-medium text-slate-300">
            Pricing
          </label>
          {!discountOpen && (
            <button
              type="button"
              onClick={() => setDiscountOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-400 hover:text-brand-300 transition"
            >
              <Tag size={12} />
              Apply Discount
            </button>
          )}
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-4 space-y-2.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Plan price</span>
            <span className="font-medium text-slate-900">
              {formatINR(planPaise)}
            </span>
          </div>

          {hasReferralCredit && (
            <label className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800 cursor-pointer">
              <input
                type="checkbox"
                checked={useReferralCredit}
                onChange={(e) => setUseReferralCredit(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-emerald-400 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="flex-1 text-xs text-emerald-300 leading-relaxed">
                <span className="inline-flex items-center gap-1 font-semibold">
                  <Gift size={12} />
                  Referral credit available
                </span>
                <br />
                Apply {REFERRAL_DISCOUNT_PERCENT}% discount from referral reward
                {referralCreditsAvailable > 1
                  ? ` (${referralCreditsAvailable} credits available)`
                  : ""}
                .
              </span>
            </label>
          )}

          {referralDiscountPaise > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-emerald-600 font-medium inline-flex items-center gap-1">
                <Gift size={12} />
                Referral discount ({REFERRAL_DISCOUNT_PERCENT}%)
              </span>
              <span className="font-medium text-emerald-600">
                − {formatINR(referralDiscountPaise)}
              </span>
            </div>
          )}

          {discountOpen && (
            <div className="pt-2.5 border-t border-slate-700 space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-slate-900 border border-slate-700 shrink-0">
                  <button
                    type="button"
                    onClick={() => setDiscountMode("percent")}
                    className={
                      discountMode === "percent"
                        ? "px-2.5 py-1 text-xs font-semibold rounded bg-brand-400 text-slate-950"
                        : "px-2.5 py-1 text-xs font-semibold rounded text-slate-400 hover:text-slate-200"
                    }
                  >
                    %
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountMode("amount")}
                    className={
                      discountMode === "amount"
                        ? "px-2.5 py-1 text-xs font-semibold rounded bg-brand-400 text-slate-950"
                        : "px-2.5 py-1 text-xs font-semibold rounded text-slate-400 hover:text-slate-200"
                    }
                  >
                    ₹
                  </button>
                </div>
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={discountMode === "percent" ? 100 : undefined}
                  step="any"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  placeholder={discountMode === "percent" ? "10" : "200"}
                  autoFocus
                  className="flex-1 min-w-0 px-3 py-1.5 border border-slate-700 bg-slate-900 text-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/50"
                />
                <button
                  type="button"
                  onClick={clearDiscount}
                  className="p-1.5 text-slate-400 hover:bg-slate-200 rounded transition shrink-0"
                  title="Remove discount"
                >
                  <X size={14} />
                </button>
              </div>

              {manualDiscountPaise > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-emerald-600 font-medium">
                    Manual discount
                    {discountMode === "percent" && discountValue
                      ? ` (${Math.min(Number(discountValue), 100)}%)`
                      : ""}
                  </span>
                  <span className="font-medium text-emerald-600">
                    − {formatINR(manualDiscountPaise)}
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="pt-2.5 border-t border-slate-700 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-300">
              Total Payable
            </span>
            <span className="text-lg font-bold text-brand-400 tracking-tight">
              {formatINR(finalPricePaise)}
            </span>
          </div>
        </div>
      </div>

      {previewEnd && (
        <div className="bg-brand-950/40 border border-brand-800 rounded-xl p-3.5 text-sm text-brand-200">
          Subscription will be valid until{" "}
          <strong>{format(previewEnd, "dd MMM yyyy")}</strong>.
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="bg-brand-400 hover:bg-brand-300 hover:shadow-glow disabled:opacity-60 text-slate-950 font-semibold px-5 py-2.5 rounded-lg transition shadow-sm"
      >
        {submitting ? "Saving…" : "Mark as Paid"}
      </button>
    </form>
  );
}
