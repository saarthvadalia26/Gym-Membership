import { redirect } from "next/navigation";
import { Settings as SettingsIcon } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SettingsForm } from "@/components/SettingsForm";
import { GymProfileForm } from "@/components/GymProfileForm";
import { StaffManager } from "@/components/StaffManager";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SignOutButton } from "@/components/SignOutButton";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const u = session.user as { id?: string; gymId?: string; role?: string };
  if (!u.id || !u.gymId) redirect("/login");

  const isOwner = u.role !== "TRAINER";

  const [user, gym, staff] = await Promise.all([
    prisma.user.findUnique({
      where: { id: u.id },
      select: { email: true },
    }),
    prisma.gym.findUnique({
      where: { id: u.gymId },
      select: { name: true, address: true, phone: true },
    }),
    isOwner
      ? prisma.user.findMany({
          where: { gymId: u.gymId },
          select: { id: true, email: true, role: true, createdAt: true },
          orderBy: { createdAt: "asc" },
        })
      : Promise.resolve([]),
  ]);

  if (!user || !gym) redirect("/login");

  return (
    <div className="max-w-2xl animate-fade-in">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-brand-50 dark:bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400">
            <SettingsIcon size={20} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Settings
          </h1>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 ml-12">
          {isOwner
            ? "Manage your gym profile, staff, and account credentials."
            : "Manage your account credentials."}
        </p>
      </div>

      <div className="space-y-6">
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 px-1">
            Appearance
          </h2>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-soft p-7">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  Theme
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Choose light, dark, or match your system preference.
                </div>
              </div>
              <div className="w-48 shrink-0">
                <ThemeToggle />
              </div>
            </div>
          </div>
        </section>

        {isOwner && (
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 px-1">
              Gym Profile
            </h2>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-soft p-7">
              <GymProfileForm
                initial={{
                  name: gym.name,
                  address: gym.address ?? "",
                  phone: gym.phone ?? "",
                }}
              />
            </div>
          </section>
        )}

        {isOwner && (
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 px-1">
              Staff
            </h2>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-soft p-7">
              <StaffManager initialStaff={staff} currentUserId={u.id} />
            </div>
          </section>
        )}

        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 px-1">
            Account Credentials
          </h2>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-soft p-7">
            <SettingsForm currentEmail={user.email} />
          </div>
        </section>

        <section>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-soft p-7">
            <SignOutButton />
          </div>
        </section>
      </div>
    </div>
  );
}
