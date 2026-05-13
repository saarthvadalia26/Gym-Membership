import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { Logo } from "@/components/Logo";
import { ResetPasswordForm } from "@/components/ResetPasswordForm";

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const session = await auth();
  if (session) redirect("/");

  const { token } = await searchParams;

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-brand-50 to-emerald-50 dark:from-[#0f172a] dark:via-[#0f1f04] dark:to-[#0f172a]" />
      <div className="absolute top-0 -left-32 w-96 h-96 bg-brand-800 rounded-full mix-blend-screen filter blur-3xl opacity-40 animate-pulse" />
      <div className="absolute bottom-0 -right-32 w-96 h-96 bg-cyan-200 dark:bg-cyan-900/40 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-40 animate-pulse" />

      <div className="relative w-full max-w-md animate-slide-up">
        <div className="bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-300 dark:border-slate-700/50 p-8 sm:p-10">
          <div className="flex flex-col items-center mb-7">
            <Logo className="w-16 h-16 rounded-2xl shadow-glow mb-4" />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Set a new password
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 text-center">
              Pick something you&apos;ll remember.
            </p>
          </div>

          {!token ? (
            <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700">
              Reset link is missing the token. Please request a new one from{" "}
              <Link href="/forgot-password" className="font-semibold underline">
                Forgot password
              </Link>
              .
            </div>
          ) : (
            <ResetPasswordForm token={token} />
          )}

          <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
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
