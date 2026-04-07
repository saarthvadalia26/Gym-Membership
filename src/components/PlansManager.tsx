"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, X, Check } from "lucide-react";
import { formatINRCompact, parseINR } from "@/lib/currency";
import { ConfirmDialog } from "./ui/ConfirmDialog";

interface Plan {
  id: string;
  name: string;
  pricePaise: number;
  durationDays: number;
}

export function PlansManager({ initialPlans }: { initialPlans: Plan[] }) {
  const router = useRouter();
  const [plans, setPlans] = useState(initialPlans);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Plan | null>(null);

  function refresh() {
    router.refresh();
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const priceInput = String(formData.get("price") ?? "");
    const durationInput = String(formData.get("duration") ?? "");

    const pricePaise = parseINR(priceInput);
    const durationDays = Number(durationInput);

    if (!name || pricePaise === null || !Number.isInteger(durationDays) || durationDays <= 0) {
      toast.error("All fields are required. Price and duration must be valid numbers.");
      return;
    }

    const res = await fetch("/api/plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, pricePaise, durationDays }),
    });

    if (!res.ok) {
      toast.error("Could not create plan");
      return;
    }
    const created = await res.json();
    setPlans((p) => [...p, created].sort((a, b) => a.durationDays - b.durationDays));
    setCreating(false);
    toast.success(`Plan "${name}" created`);
    refresh();
  }

  async function handleUpdate(id: string, e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const pricePaise = parseINR(String(formData.get("price") ?? ""));
    const durationDays = Number(formData.get("duration") ?? 0);

    if (!name || pricePaise === null || durationDays <= 0) {
      toast.error("Invalid input");
      return;
    }

    const res = await fetch(`/api/plans/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, pricePaise, durationDays }),
    });
    if (!res.ok) {
      toast.error("Could not update plan");
      return;
    }
    const updated = await res.json();
    setPlans((p) =>
      p
        .map((x) => (x.id === id ? updated : x))
        .sort((a, b) => a.durationDays - b.durationDays)
    );
    setEditingId(null);
    toast.success("Plan updated");
    refresh();
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    const res = await fetch(`/api/plans/${target.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data?.error ?? "Could not delete plan");
      return;
    }
    setPlans((p) => p.filter((x) => x.id !== target.id));
    toast.success(`Plan "${target.name}" deleted`);
    refresh();
  }

  return (
    <div>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-soft overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider">
            <tr>
              <th className="text-left px-5 py-3.5 font-semibold">Plan Name</th>
              <th className="text-right px-5 py-3.5 font-semibold">Price</th>
              <th className="text-right px-5 py-3.5 font-semibold">Duration</th>
              <th className="text-right px-5 py-3.5 font-semibold w-32">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {plans.length === 0 && !creating && (
              <tr>
                <td colSpan={4} className="px-5 py-12 text-center text-slate-400 dark:text-slate-500">
                  No plans yet. Click <span className="font-semibold">Add Plan</span> below.
                </td>
              </tr>
            )}

            {plans.map((p) =>
              editingId === p.id ? (
                <tr key={p.id} className="bg-slate-50 dark:bg-slate-800/40">
                  <td colSpan={4} className="px-5 py-3">
                    <form
                      onSubmit={(e) => handleUpdate(p.id, e)}
                      className="flex flex-wrap items-center gap-3"
                    >
                      <input
                        name="name"
                        defaultValue={p.name}
                        placeholder="Name"
                        className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-lg text-sm flex-1 min-w-32 focus:outline-none focus:ring-2 focus:ring-brand-500"
                        required
                      />
                      <input
                        name="price"
                        defaultValue={(p.pricePaise / 100).toString()}
                        placeholder="Price (₹)"
                        className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-lg text-sm w-32 focus:outline-none focus:ring-2 focus:ring-brand-500"
                        required
                      />
                      <input
                        name="duration"
                        type="number"
                        defaultValue={p.durationDays}
                        placeholder="Days"
                        className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-lg text-sm w-24 focus:outline-none focus:ring-2 focus:ring-brand-500"
                        min={1}
                        required
                      />
                      <button
                        type="submit"
                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded"
                        title="Save"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="p-1.5 text-slate-500 hover:bg-slate-100 rounded"
                        title="Cancel"
                      >
                        <X size={16} />
                      </button>
                    </form>
                  </td>
                </tr>
              ) : (
                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                  <td className="px-5 py-3.5 font-medium text-slate-900 dark:text-slate-100">{p.name}</td>
                  <td className="px-5 py-3.5 text-right font-semibold text-slate-900 dark:text-slate-100">
                    {formatINRCompact(p.pricePaise)}
                  </td>
                  <td className="px-5 py-3.5 text-right text-slate-600 dark:text-slate-300">
                    {p.durationDays} days
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setEditingId(p.id)}
                        className="p-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition"
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(p)}
                        className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded transition"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            )}

            {creating && (
              <tr className="bg-slate-50 dark:bg-slate-800/40">
                <td colSpan={4} className="px-5 py-3">
                  <form
                    onSubmit={handleCreate}
                    className="flex flex-wrap items-center gap-3"
                  >
                    <input
                      name="name"
                      placeholder="e.g. Half-Yearly"
                      className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm flex-1 min-w-32 focus:outline-none focus:ring-2 focus:ring-brand-500"
                      required
                    />
                    <input
                      name="price"
                      placeholder="Price (₹)"
                      className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm w-32 focus:outline-none focus:ring-2 focus:ring-brand-500"
                      required
                    />
                    <input
                      name="duration"
                      type="number"
                      placeholder="Days"
                      className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm w-24 focus:outline-none focus:ring-2 focus:ring-brand-500"
                      min={1}
                      required
                    />
                    <button
                      type="submit"
                      className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded"
                      title="Save"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setCreating(false)}
                      className="p-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
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

      {!creating && (
        <button
          onClick={() => setCreating(true)}
          className="mt-4 inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 hover:shadow-glow text-white font-medium px-4 py-2.5 rounded-lg transition shadow-sm"
        >
          <Plus size={16} /> Add Plan
        </button>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title={`Delete "${deleteTarget?.name}" plan?`}
        message="Plans with existing subscriptions cannot be deleted. This preserves your revenue history."
        confirmLabel="Delete Plan"
        cancelLabel="Keep"
        tone="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
