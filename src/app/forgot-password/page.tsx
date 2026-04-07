import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { ForgotPasswordForm } from "@/components/ForgotPasswordForm";

export const dynamic = "force-dynamic";

export default async function ForgotPasswordPage() {
  const session = await auth();
  if (session) redirect("/");

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-brand-50 to-violet-50 dark:from-[#0b1020] dark:via-[#15103a] dark:to-[#1e1240]" />
      <div className="absolute top-0 -left-32 w-96 h-96 bg-brand-200 dark:bg-brand-700/40 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-40 animate-pulse" />
      <div className="absolute bottom-0 -right-32 w-96 h-96 bg-violet-200 dark:bg-violet-700/40 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-40 animate-pulse" />

      <div className="relative w-full max-w-md animate-slide-up">
        <div className="bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/60 dark:border-slate-700/50 p-8 sm:p-10">
          <div className="flex flex-col items-center mb-7">
            <Image
              src="/logo.svg"
              alt="Logo"
              width={64}
              height={64}
              className="rounded-2xl shadow-glow mb-4"
              priority
            />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Forgot password
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 text-center">
              Enter your email and we&apos;ll send you a reset link.
            </p>
          </div>

          <ForgotPasswordForm />

          <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Remembered it?{" "}
            <Link
              href="/login"
              className="font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300"
            >
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
