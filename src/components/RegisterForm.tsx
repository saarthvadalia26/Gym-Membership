"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Building2, Mail, Lock, MapPin, Phone, ArrowRight } from "lucide-react";
import { signIn } from "next-auth/react";
import { PasswordInput } from "./ui/PasswordInput";

export function RegisterForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const fd = new FormData(e.currentTarget);
    const payload = {
      gymName: String(fd.get("gymName") ?? "").trim(),
      email: String(fd.get("email") ?? "").trim(),
      password: String(fd.get("password") ?? ""),
      confirmPassword: String(fd.get("confirmPassword") ?? ""),
      address: String(fd.get("address") ?? "").trim(),
      phone: String(fd.get("phone") ?? "").trim(),
    };

    if (!payload.gymName || !payload.email || !payload.password) {
      toast.error("Gym name, email, and password are required");
      return;
    }
    if (payload.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (payload.password !== payload.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setSubmitting(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gymName: payload.gymName,
        email: payload.email,
        password: payload.password,
        address: payload.address,
        phone: payload.phone,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data?.error ?? "Could not create account");
      setSubmitting(false);
      return;
    }

    toast.success("Welcome! Signing you in…");

    // Auto sign-in so the user lands directly on their dashboard
    const signInResult = await signIn("credentials", {
      email: payload.email,
      password: payload.password,
      redirect: false,
    });

    if (signInResult?.error) {
      toast.error("Account created. Please sign in manually.");
      router.push("/login");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field
        name="gymName"
        label="Gym Name"
        icon={Building2}
        type="text"
        placeholder="e.g. Iron Temple Fitness"
        required
        autoComplete="organization"
      />
      <Field
        name="email"
        label="Owner Email"
        icon={Mail}
        type="email"
        placeholder="you@yourgym.com"
        required
        autoComplete="email"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field
          name="password"
          label="Password"
          icon={Lock}
          type="password"
          placeholder="At least 6 characters"
          required
          minLength={6}
          autoComplete="new-password"
        />
        <Field
          name="confirmPassword"
          label="Confirm"
          icon={Lock}
          type="password"
          placeholder="Repeat password"
          required
          minLength={6}
          autoComplete="new-password"
        />
      </div>

      <div className="border-t border-slate-300 dark:border-slate-700/60 pt-4 mt-2">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
          Optional — shown on PDF receipts
        </div>
        <div className="space-y-3">
          <Field
            name="address"
            label="Gym Address"
            icon={MapPin}
            type="text"
            placeholder="123 Main Street, Your City"
            autoComplete="street-address"
          />
          <Field
            name="phone"
            label="Gym Phone"
            icon={Phone}
            type="tel"
            placeholder="+91 99999 99999"
            autoComplete="tel"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full mt-5 inline-flex items-center justify-center gap-2 bg-brand-400 hover:bg-brand-300 hover:shadow-glow disabled:opacity-60 text-slate-950 font-semibold py-3 rounded-xl transition-all shadow-sm"
      >
        {submitting ? "Creating account…" : "Create Account"}
        {!submitting && <ArrowRight size={16} />}
      </button>
    </form>
  );
}

interface FieldProps {
  name: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  type: string;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
  autoComplete?: string;
}

function Field({
  name,
  label,
  icon: Icon,
  type,
  placeholder,
  required,
  minLength,
  autoComplete,
}: FieldProps) {
  return (
    <div>
      <label
        htmlFor={name}
        className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
      >
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {type === "password" ? (
        <PasswordInput
          id={name}
          name={name}
          placeholder={placeholder}
          required={required}
          minLength={minLength}
          autoComplete={autoComplete}
          className="w-full pl-9 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400/50 focus:border-brand-400 transition placeholder:text-slate-400 text-sm"
          leftIcon={
            <Icon
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            />
          }
        />
      ) : (
        <div className="relative">
          <Icon
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <input
            id={name}
            name={name}
            type={type}
            placeholder={placeholder}
            required={required}
            minLength={minLength}
            autoComplete={autoComplete}
            className="w-full pl-9 pr-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400/50 focus:border-brand-400 transition placeholder:text-slate-400 text-sm"
          />
        </div>
      )}
    </div>
  );
}
