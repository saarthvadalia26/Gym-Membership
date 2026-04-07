"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Mail, ArrowRight, CheckCircle2 } from "lucide-react";

export function ForgotPasswordForm() {
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "").trim();
    if (!email) {
      toast.error("Enter your email");
      return;
    }

    setSubmitting(true);
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data?.error ?? "Something went wrong");
      setSubmitting(false);
      return;
    }

    setDone(true);
    setSubmitting(false);
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 p-5 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/60 mb-3">
          <CheckCircle2
            className="text-emerald-600 dark:text-emerald-400"
            size={26}
          />
        </div>
        <h2 className="font-semibold text-emerald-900 dark:text-emerald-200">
          Check your inbox
        </h2>
        <p className="text-sm text-emerald-700 dark:text-emerald-400 mt-1.5 leading-relaxed">
          If an account exists for that email, we&apos;ve sent a link to
          reset your password. The link expires in 1 hour.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
        >
          Email
        </label>
        <div className="relative">
          <Mail
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
          />
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@yourgym.com"
            className="w-full pl-9 pr-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full inline-flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 hover:shadow-glow disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-all shadow-sm"
      >
        {submitting ? "Sending…" : "Send reset link"}
        {!submitting && <ArrowRight size={16} />}
      </button>
    </form>
  );
}
