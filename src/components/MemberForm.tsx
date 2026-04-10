"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Props {
  initial?: {
    id: string;
    fullName: string;
    phoneNumber: string;
    emergencyContact: string | null;
    dateOfBirth?: string | null;
  };
  mode: "create" | "edit";
}

export function MemberForm({ initial, mode }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const payload = {
      fullName: String(formData.get("fullName") ?? ""),
      phoneNumber: String(formData.get("phoneNumber") ?? ""),
      emergencyContact: String(formData.get("emergencyContact") ?? ""),
      dateOfBirth: String(formData.get("dateOfBirth") ?? ""),
      referredByCode: String(formData.get("referredByCode") ?? ""),
    };

    const url = mode === "create" ? "/api/members" : `/api/members/${initial?.id}`;
    const method = mode === "create" ? "POST" : "PATCH";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const fieldErrors = data?.error;
      let msg = "Could not save member";
      if (fieldErrors && typeof fieldErrors === "object") {
        const first = Object.values(fieldErrors).flat()[0];
        if (typeof first === "string") msg = first;
      }
      toast.error(msg);
      setSubmitting(false);
      return;
    }

    const member = await res.json();
    toast.success(mode === "create" ? "Member created" : "Member updated");
    router.push(`/members/${member.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">
          Full Name
        </label>
        <input
          name="fullName"
          required
          defaultValue={initial?.fullName}
          className="w-full px-3.5 py-2.5 border border-slate-700 bg-slate-900 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400/50 focus:border-brand-400 transition"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">
          Phone Number
        </label>
        <input
          name="phoneNumber"
          required
          placeholder="+91 99999 99999"
          defaultValue={initial?.phoneNumber}
          className="w-full px-3.5 py-2.5 border border-slate-700 bg-slate-900 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400/50 focus:border-brand-400 transition"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">
          Date of Birth <span className="text-slate-400 font-normal">(optional)</span>
        </label>
        <input
          type="date"
          name="dateOfBirth"
          defaultValue={
            initial?.dateOfBirth
              ? new Date(initial.dateOfBirth).toISOString().slice(0, 10)
              : ""
          }
          className="w-full px-3.5 py-2.5 border border-slate-700 bg-slate-900 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400/50 focus:border-brand-400 transition"
        />
        <p className="text-xs text-slate-400 mt-1.5">
          We&apos;ll surface their birthday on the dashboard so you can wish them.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">
          Emergency Contact <span className="text-slate-400 font-normal">(optional)</span>
        </label>
        <input
          name="emergencyContact"
          defaultValue={initial?.emergencyContact ?? ""}
          className="w-full px-3.5 py-2.5 border border-slate-700 bg-slate-900 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400/50 focus:border-brand-400 transition"
        />
      </div>

      {mode === "create" && (
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Referred by code <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <input
            name="referredByCode"
            placeholder="e.g. IRON-7K9P"
            className="w-full px-3.5 py-2.5 border border-slate-700 bg-slate-900 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400/50 focus:border-brand-400 transition uppercase placeholder:normal-case"
          />
          <p className="text-xs text-slate-400 mt-1.5">
            If another member referred them, paste the referrer&apos;s code here.
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="bg-brand-400 hover:bg-brand-300 hover:shadow-glow disabled:opacity-60 text-slate-950 font-medium px-5 py-2.5 rounded-lg transition shadow-sm"
      >
        {submitting ? "Saving…" : mode === "create" ? "Create Member" : "Save Changes"}
      </button>
    </form>
  );
}
