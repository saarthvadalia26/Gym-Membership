import { redirect } from "next/navigation";
import Link from "next/link";
import { auth, signIn } from "@/lib/auth";
import { Logo } from "@/components/Logo";
import { AuthError } from "next-auth";
import { PasswordInput } from "@/components/ui/PasswordInput";

const APP_NAME = "Gym Membership";

async function loginAction(formData: FormData) {
  "use server";
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect(`/login?error=${encodeURIComponent("Invalid email or password")}`);
    }
    throw error;
  }
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (session) redirect("/");

  const { error } = await searchParams;

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 overflow-hidden">
      {/* Background gradient + decorative blobs */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-brand-50 to-emerald-50 dark:from-[#0f172a] dark:via-[#0f1f04] dark:to-[#0f172a]" />
      <div className="absolute top-0 -left-32 w-96 h-96 bg-brand-200 dark:bg-brand-700/40 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-40 animate-pulse" />
      <div className="absolute bottom-0 -right-32 w-96 h-96 bg-cyan-200 dark:bg-cyan-900/40 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-40 animate-pulse" />

      <div className="relative w-full max-w-md animate-slide-up">
        <div className="bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-300 dark:border-slate-700/50 p-8 sm:p-10">
          <div className="flex flex-col items-center mb-8">
            <Logo className="w-[72px] h-[72px] rounded-2xl shadow-glow mb-4" />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Welcome back
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Sign in to your gym dashboard
            </p>
          </div>

          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium animate-fade-in">
              {error}
            </div>
          )}

          <form action={loginAction} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@yourgym.com"
                className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400/50 focus:border-brand-400 transition placeholder:text-slate-500"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Password
              </label>
              <PasswordInput
                id="password"
                name="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400/50 focus:border-brand-400 transition placeholder:text-slate-500"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-brand-400 hover:bg-brand-300 hover:shadow-glow text-slate-950 font-semibold py-3 rounded-xl transition-all shadow-sm mt-2"
            >
              Sign In
            </button>
          </form>

          <div className="mt-4 text-center text-sm">
            <Link
              href="/forgot-password"
              className="text-slate-500 dark:text-slate-400 hover:text-brand-400 transition"
            >
              Forgot your password?
            </Link>
          </div>

          <div className="mt-6 pt-5 border-t border-slate-300 dark:border-slate-700/60 text-center text-sm text-slate-500 dark:text-slate-400">
            New here?{" "}
            <Link
              href="/register"
              className="font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300"
            >
              Create your gym account
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-6">
          Membership management for gyms and clubs
        </p>
      </div>
    </div>
  );
}
