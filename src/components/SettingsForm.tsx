"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Mail, Lock, Save } from "lucide-react";
import { signOutAction } from "@/app/actions";
import { PasswordInput } from "./ui/PasswordInput";

interface Props {
  currentEmail: string;
}

export function SettingsForm({ currentEmail }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const currentPassword = String(formData.get("currentPassword") ?? "");
    const newEmail = String(formData.get("newEmail") ?? "").trim();
    const newPassword = String(formData.get("newPassword") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (!currentPassword) {
      toast.error("Enter your current password to confirm");
      return;
    }
    if (!newEmail && !newPassword) {
      toast.error("Provide a new email or a new password");
      return;
    }
    if (newPassword && newPassword !== confirmPassword) {
      toast.error("New password and confirmation do not match");
      return;
    }

    setSubmitting(true);
    const res = await fetch("/api/settings/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newEmail, newPassword }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data?.error ?? "Could not update account");
      setSubmitting(false);
      return;
    }

    const data = await res.json();

    // Email changes don't break the session (JWT keys off id), but to keep the
    // login form consistent we sign the user out so they re-enter the new email.
    if (data.emailChanged) {
      toast.success("Email updated. Please sign in again.");
      setTimeout(() => signOutAction(), 1200);
      return;
    }

    toast.success("Account updated");
    form.reset();
    setSubmitting(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          Current Email
        </label>
        <div className="px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-200 text-sm">
          {currentEmail}
        </div>
      </div>

      <div className="border-t border-slate-200 dark:border-slate-800 pt-6">
        <div className="flex items-center gap-2 mb-4">
          <Mail size={16} className="text-brand-600 dark:text-brand-400" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Change Email</h3>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            New Email <span className="text-slate-500 dark:text-slate-400 font-normal">(optional)</span>
          </label>
          <input
            name="newEmail"
            type="email"
            placeholder="you@yourgym.com"
            className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400/50 focus:border-brand-400 transition"
          />
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
            Changing your email will sign you out so you can sign back in with the new address.
          </p>
        </div>
      </div>

      <div className="border-t border-slate-200 dark:border-slate-800 pt-6">
        <div className="flex items-center gap-2 mb-4">
          <Lock size={16} className="text-brand-600 dark:text-brand-400" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Change Password</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              New Password <span className="text-slate-500 dark:text-slate-400 font-normal">(optional)</span>
            </label>
            <PasswordInput
              name="newPassword"
              autoComplete="new-password"
              minLength={6}
              className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400/50 focus:border-brand-400 transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Confirm New Password
            </label>
            <PasswordInput
              name="confirmPassword"
              autoComplete="new-password"
              minLength={6}
              className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400/50 focus:border-brand-400 transition"
            />
          </div>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
          Minimum 6 characters. Leave blank to keep your current password.
        </p>
      </div>

      <div className="border-t border-slate-200 dark:border-slate-800 pt-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Current Password <span className="text-red-500">*</span>
          </label>
          <PasswordInput
            name="currentPassword"
            autoComplete="current-password"
            required
            className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400/50 focus:border-brand-400 transition"
          />
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
            Required to confirm any changes.
          </p>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 bg-brand-400 hover:bg-brand-300 hover:shadow-glow disabled:opacity-60 text-slate-950 font-medium px-5 py-2.5 rounded-lg transition shadow-sm"
        >
          <Save size={16} />
          {submitting ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
