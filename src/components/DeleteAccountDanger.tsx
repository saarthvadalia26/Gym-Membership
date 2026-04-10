"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Trash2 } from "lucide-react";
import { signOutAction } from "@/app/actions";
import { PasswordInput } from "./ui/PasswordInput";

interface Props {
  gymName: string;
}

export function DeleteAccountDanger({ gymName }: Props) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmName, setConfirmName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canDelete =
    password.length > 0 &&
    confirmName.trim().toLowerCase() === gymName.trim().toLowerCase();

  function close() {
    setOpen(false);
    setPassword("");
    setConfirmName("");
  }

  async function handleDelete(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canDelete || submitting) return;

    setSubmitting(true);
    const res = await fetch("/api/settings/account/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password, confirmGymName: confirmName }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data?.error ?? "Could not delete account");
      setSubmitting(false);
      return;
    }

    toast.success("Account deleted. Signing you out…");
    setTimeout(() => signOutAction(), 800);
  }

  return (
    <>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-red-700">
            Delete this account
          </h3>
          <p className="text-sm text-slate-400 mt-1.5">
            Permanently delete <strong>{gymName}</strong> and everything in it
            — all members, plans, subscriptions, and check-in history.{" "}
            <span className="font-semibold text-red-600">
              This cannot be undone.
            </span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 bg-slate-900 hover:bg-red-950/40 text-red-400 font-semibold px-4 py-2.5 rounded-lg border border-red-800 transition shadow-sm shrink-0"
        >
          <Trash2 size={16} />
          Delete Account
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={close}
          />
          <div className="relative bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 max-w-md w-full p-6 animate-slide-up">
            <div className="flex items-start gap-4 mb-5">
              <div className="shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="text-red-600" size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold text-slate-100">
                  Delete {gymName}?
                </h2>
                <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                  This will permanently erase your gym, your login, and every
                  member, plan, subscription, and check-in. There is no undo.
                </p>
              </div>
            </div>

            <form onSubmit={handleDelete} className="space-y-4">
              <div>
                <label
                  htmlFor="del-password"
                  className="block text-sm font-medium text-slate-300 mb-1.5"
                >
                  Confirm with your password
                </label>
                <PasswordInput
                  id="del-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="w-full px-3.5 py-2.5 border border-slate-700 bg-slate-900 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="del-name"
                  className="block text-sm font-medium text-slate-300 mb-1.5"
                >
                  Type{" "}
                  <code className="px-1.5 py-0.5 rounded bg-slate-800 text-red-400 font-semibold">
                    {gymName}
                  </code>{" "}
                  to confirm
                </label>
                <input
                  id="del-name"
                  type="text"
                  value={confirmName}
                  onChange={(e) => setConfirmName(e.target.value)}
                  placeholder={gymName}
                  className="w-full px-3.5 py-2.5 border border-slate-700 bg-slate-900 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={close}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!canDelete || submitting}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed transition shadow-sm"
                >
                  <Trash2 size={14} />
                  {submitting ? "Deleting…" : "Delete Forever"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
