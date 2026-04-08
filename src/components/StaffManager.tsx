"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, Crown, Dumbbell, X, Check } from "lucide-react";
import { format } from "date-fns";
import { ConfirmDialog } from "./ui/ConfirmDialog";

interface StaffUser {
  id: string;
  email: string;
  role: string;
  createdAt: string | Date;
}

interface Props {
  initialStaff: StaffUser[];
  currentUserId: string;
}

export function StaffManager({ initialStaff, currentUserId }: Props) {
  const router = useRouter();
  const [staff, setStaff] = useState<StaffUser[]>(initialStaff);
  const [adding, setAdding] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<StaffUser | null>(null);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const email = String(fd.get("email") ?? "").trim();
    const password = String(fd.get("password") ?? "");
    const role = String(fd.get("role") ?? "TRAINER");

    if (!email || !password) {
      toast.error("Email and password are required");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    const res = await fetch("/api/settings/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, role }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data?.error ?? "Could not add staff");
      return;
    }

    const created: StaffUser = await res.json();
    setStaff((s) => [...s, created]);
    form.reset();
    setAdding(false);
    toast.success(`${role === "OWNER" ? "Owner" : "Trainer"} added`);
    router.refresh();
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    const res = await fetch(`/api/settings/staff/${target.id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data?.error ?? "Could not remove staff");
      return;
    }
    setStaff((s) => s.filter((u) => u.id !== target.id));
    toast.success(`${target.email} removed`);
    router.refresh();
  }

  return (
    <div>
      <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">Email</th>
              <th className="text-left px-4 py-3 font-semibold">Role</th>
              <th className="text-left px-4 py-3 font-semibold">Added</th>
              <th className="px-4 py-3 w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {staff.map((u) => (
              <tr key={u.id} className="hover:bg-white dark:hover:bg-slate-800/60">
                <td className="px-4 py-3 text-slate-900 dark:text-slate-100 font-medium">
                  {u.email}
                  {u.id === currentUserId && (
                    <span className="ml-2 text-xs text-slate-500 dark:text-slate-400 font-normal">
                      (you)
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {u.role === "OWNER" ? (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                      <Crown size={11} />
                      Owner
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-brand-100 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
                      <Dumbbell size={11} />
                      Trainer
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400 text-xs">
                  {format(new Date(u.createdAt), "dd MMM yyyy")}
                </td>
                <td className="px-4 py-3 text-right">
                  {u.id !== currentUserId && (
                    <button
                      onClick={() => setDeleteTarget(u)}
                      className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded transition"
                      title="Remove"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {adding && (
              <tr className="bg-white dark:bg-slate-800/60">
                <td colSpan={4} className="px-4 py-3">
                  <form
                    onSubmit={handleCreate}
                    className="flex flex-wrap items-center gap-2"
                  >
                    <input
                      name="email"
                      type="email"
                      placeholder="trainer@email.com"
                      required
                      className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-lg text-sm flex-1 min-w-40 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    <input
                      name="password"
                      type="password"
                      placeholder="Password (min 6)"
                      required
                      minLength={6}
                      className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-lg text-sm w-44 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    <select
                      name="role"
                      defaultValue="TRAINER"
                      className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                      <option value="TRAINER">Trainer</option>
                      <option value="OWNER">Owner</option>
                    </select>
                    <button
                      type="submit"
                      className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded transition"
                      title="Create"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdding(false)}
                      className="p-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition"
                      title="Cancel"
                    >
                      <X size={16} />
                    </button>
                  </form>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {!adding && (
        <button
          onClick={() => setAdding(true)}
          className="mt-4 inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 hover:shadow-glow text-white text-sm font-semibold px-4 py-2 rounded-lg transition shadow-sm"
        >
          <Plus size={14} />
          Add Staff Member
        </button>
      )}

      <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 leading-relaxed">
        <strong>Trainers</strong> can do check-ins and view members. <strong>Owners</strong> can do everything: edit plans, record payments, delete members, and manage staff.
      </p>

      <ConfirmDialog
        open={!!deleteTarget}
        title={`Remove ${deleteTarget?.email}?`}
        message="They'll be signed out and lose access to this gym immediately. You can re-add them later if needed."
        confirmLabel="Remove"
        cancelLabel="Keep"
        tone="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
