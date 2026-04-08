"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Lock, ArrowRight } from "lucide-react";
import { PasswordInput } from "./ui/PasswordInput";

interface Props {
  token: string;
}

export function ResetPasswordForm({ token }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const password = String(fd.get("password") ?? "");
    const confirm = String(fd.get("confirm") ?? "");

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }

    setSubmitting(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data?.error ?? "Could not reset password");
      setSubmitting(false);
      return;
    }

    toast.success("Password updated. Sign in with your new password.");
    setTimeout(() => router.push("/login"), 1000);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
        >
          New Password
        </label>
        <PasswordInput
          id="password"
          name="password"
          required
          minLength={6}
          autoComplete="new-password"
          placeholder="At least 6 characters"
          className="w-full pl-9 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm"
          leftIcon={
            <Lock
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
            />
          }
        />
      </div>

      <div>
        <label
          htmlFor="confirm"
          className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
        >
          Confirm Password
        </label>
        <PasswordInput
          id="confirm"
          name="confirm"
          required
          minLength={6}
          autoComplete="new-password"
          placeholder="Repeat password"
          className="w-full pl-9 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm"
          leftIcon={
            <Lock
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
            />
          }
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full inline-flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 hover:shadow-glow disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-all shadow-sm mt-2"
      >
        {submitting ? "Saving…" : "Update Password"}
        {!submitting && <ArrowRight size={16} />}
      </button>
    </form>
  );
}
