"use client";

import { useEffect, useRef, useState } from "react";
import { Search, Check, X, ScanLine } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { computeStatus, daysRemaining } from "@/lib/status";
import { QRScanner } from "./QRScanner";

interface Member {
  id: string;
  fullName: string;
  phoneNumber: string;
  subscriptions: Array<{
    endDate: string;
    plan: { name: string };
  }>;
}

interface CheckInResult {
  allowed: boolean;
  member: { fullName: string; phoneNumber: string };
  subscription: { planName: string; endDate: string } | null;
}

export function CheckInScreen() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<CheckInResult | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setLoading(true);
      const res = await fetch(`/api/members?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      }
      setLoading(false);
    }, 200);
    return () => clearTimeout(t);
  }, [query]);

  // Auto-clear feedback after 4 seconds and refocus search
  useEffect(() => {
    if (!feedback) return;
    const t = setTimeout(() => {
      setFeedback(null);
      setQuery("");
      inputRef.current?.focus();
    }, 4000);
    return () => clearTimeout(t);
  }, [feedback]);

  async function handleCheckIn(memberId: string) {
    const res = await fetch("/api/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId }),
    });
    if (!res.ok) return;
    const data: CheckInResult = await res.json();
    setFeedback(data);
    setResults([]);
  }

  async function handleScan(raw: string) {
    setScannerOpen(false);
    try {
      // QRs now encode `https://<host>/m/<token>` so phone cameras open them
      // as a link, but earlier QRs encoded just the token. Accept both.
      const match = raw.match(/\/m\/([^/?#]+)/);
      const token = (match ? match[1] : raw).trim();
      if (!token) {
        toast.error("QR code is empty or unreadable");
        return;
      }
      const res = await fetch("/api/checkin/by-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err?.error ?? "Could not check in");
        return;
      }
      const data: CheckInResult = await res.json();
      setFeedback(data);
      setResults([]);
      setQuery("");
    } catch (e) {
      console.error("[checkin scan]", e);
      toast.error(
        e instanceof Error ? e.message : "Could not process the QR code"
      );
    }
  }

  if (feedback) {
    const expiry = feedback.subscription
      ? new Date(feedback.subscription.endDate)
      : null;
    const days = expiry ? daysRemaining(expiry) : null;
    return (
      <div
        className={`rounded-3xl border-2 p-12 text-center shadow-soft animate-pop ${
          feedback.allowed
            ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-700"
            : "bg-red-50 dark:bg-red-950/40 border-red-400 dark:border-red-700"
        }`}
      >
        <div
          className={`inline-flex items-center justify-center w-32 h-32 rounded-full shadow-lg ${
            feedback.allowed ? "bg-emerald-500" : "bg-red-500"
          }`}
        >
          {feedback.allowed ? (
            <Check size={72} className="text-white" />
          ) : (
            <X size={72} className="text-white" />
          )}
        </div>
        <div
          className={`text-5xl font-bold mt-6 ${
            feedback.allowed
              ? "text-emerald-700 dark:text-emerald-400"
              : "text-red-700 dark:text-red-400"
          }`}
        >
          {feedback.allowed ? "ALLOWED" : "DENIED"}
        </div>
        <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mt-4">
          {feedback.member.fullName}
        </div>
        {feedback.subscription && expiry && (
          <div className="mt-3 text-slate-600 dark:text-slate-400">
            <div className="text-base">
              {feedback.subscription.planName} • valid till{" "}
              {format(expiry, "dd MMM yyyy")}
            </div>
            {days !== null && days >= 0 && (
              <div className="text-sm mt-1">{days} days remaining</div>
            )}
            {days !== null && days < 0 && (
              <div className="text-sm mt-1 text-red-600 dark:text-red-400 font-semibold">
                Expired {Math.abs(days)} days ago — please renew
              </div>
            )}
          </div>
        )}
        {!feedback.subscription && (
          <div className="mt-3 text-red-600 dark:text-red-400 font-medium">
            No active subscription
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="max-w-2xl mx-auto flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
          <input
            ref={inputRef}
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search member by name or phone…"
            className="w-full pl-14 pr-5 py-5 text-xl border-2 border-slate-300 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-brand-500/30 focus:border-brand-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
        </div>
        <button
          type="button"
          onClick={() => setScannerOpen(true)}
          className="shrink-0 inline-flex items-center justify-center w-[72px] h-[72px] sm:w-[76px] sm:h-[76px] rounded-2xl bg-brand-600 hover:bg-brand-700 hover:shadow-glow text-white shadow-sm transition border-2 border-brand-600 hover:border-brand-700"
          title="Scan member QR code"
          aria-label="Scan QR code"
        >
          <ScanLine size={28} />
        </button>
      </div>

      <QRScanner
        open={scannerOpen}
        onScan={handleScan}
        onClose={() => setScannerOpen(false)}
      />

      <div className="max-w-2xl mx-auto mt-6">
        {loading && (
          <div className="text-center text-slate-400 dark:text-slate-500 py-4">
            Searching…
          </div>
        )}

        {!loading && query && results.length === 0 && (
          <div className="text-center text-slate-400 dark:text-slate-500 py-8">
            No members found matching &ldquo;{query}&rdquo;
          </div>
        )}

        <div className="space-y-2">
          {results.map((m) => {
            const sub = m.subscriptions[0];
            const status = sub ? computeStatus(new Date(sub.endDate)) : "RED";
            return (
              <button
                key={m.id}
                onClick={() => handleCheckIn(m.id)}
                className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-brand-400 dark:hover:border-brand-600 hover:shadow-md transition text-left"
              >
                <div>
                  <div className="font-semibold text-slate-900 dark:text-slate-100 text-lg">
                    {m.fullName}
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    {m.phoneNumber}
                    {sub && ` • ${sub.plan.name}`}
                  </div>
                </div>
                <div
                  className={`text-sm font-bold px-3 py-1.5 rounded-full ${
                    status === "GREEN"
                      ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400"
                      : status === "YELLOW"
                      ? "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400"
                      : "bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400"
                  }`}
                >
                  {status === "GREEN" ? "ACTIVE" : status === "YELLOW" ? "EXPIRING" : "EXPIRED"}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
