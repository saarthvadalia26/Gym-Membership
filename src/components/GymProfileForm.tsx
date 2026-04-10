"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Building2, MapPin, Phone, Save } from "lucide-react";

interface Props {
  initial: {
    name: string;
    address: string;
    phone: string;
  };
}

export function GymProfileForm({ initial }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: String(fd.get("name") ?? "").trim(),
      address: String(fd.get("address") ?? "").trim(),
      phone: String(fd.get("phone") ?? "").trim(),
    };

    if (!payload.name || payload.name.length < 2) {
      toast.error("Gym name must be at least 2 characters");
      return;
    }

    setSubmitting(true);
    const res = await fetch("/api/settings/gym", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data?.error ?? "Could not update gym profile");
      setSubmitting(false);
      return;
    }

    toast.success("Gym profile updated");
    setSubmitting(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label
          htmlFor="gym-name"
          className="block text-sm font-medium text-slate-300 mb-1.5"
        >
          Gym Name <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Building2
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <input
            id="gym-name"
            name="name"
            type="text"
            defaultValue={initial.name}
            required
            className="w-full pl-9 pr-3.5 py-2.5 border border-slate-700 bg-slate-900 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400/50 focus:border-brand-400 transition"
          />
        </div>
        <p className="text-xs text-slate-400 mt-1.5">
          Shown in the sidebar and on PDF receipts.
        </p>
      </div>

      <div>
        <label
          htmlFor="gym-address"
          className="block text-sm font-medium text-slate-300 mb-1.5"
        >
          Address
        </label>
        <div className="relative">
          <MapPin
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <input
            id="gym-address"
            name="address"
            type="text"
            defaultValue={initial.address}
            placeholder="123 Main Street, Your City"
            className="w-full pl-9 pr-3.5 py-2.5 border border-slate-700 bg-slate-900 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400/50 focus:border-brand-400 transition"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="gym-phone"
          className="block text-sm font-medium text-slate-300 mb-1.5"
        >
          Phone
        </label>
        <div className="relative">
          <Phone
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <input
            id="gym-phone"
            name="phone"
            type="tel"
            defaultValue={initial.phone}
            placeholder="+91 99999 99999"
            className="w-full pl-9 pr-3.5 py-2.5 border border-slate-700 bg-slate-900 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400/50 focus:border-brand-400 transition"
          />
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 bg-brand-400 hover:bg-brand-300 hover:shadow-glow disabled:opacity-60 text-slate-950 font-medium px-5 py-2.5 rounded-lg transition shadow-sm"
        >
          <Save size={16} />
          {submitting ? "Saving…" : "Save Profile"}
        </button>
      </div>
    </form>
  );
}
