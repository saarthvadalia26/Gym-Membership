import { redirect } from "next/navigation";
import { Settings as SettingsIcon } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SettingsForm } from "@/components/SettingsForm";
import { GymProfileForm } from "@/components/GymProfileForm";
import { DeleteAccountDanger } from "@/components/DeleteAccountDanger";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = (session.user as { id?: string }).id;
  const gymId = (session.user as { gymId?: string }).gymId;
  if (!userId || !gymId) redirect("/login");

  const [user, gym] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { email: true } }),
    prisma.gym.findUnique({
      where: { id: gymId },
      select: { name: true, address: true, phone: true },
    }),
  ]);

  if (!user || !gym) redirect("/login");

  return (
    <div className="max-w-2xl animate-fade-in">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400">
            <SettingsIcon size={20} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Settings
          </h1>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 ml-12">
          Manage your gym profile and account credentials.
        </p>
      </div>

      <div className="space-y-6">
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

        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 px-1">
            Account Credentials
          </h2>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-soft p-7">
            <SettingsForm currentEmail={user.email} />
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-red-600 dark:text-red-400 mb-3 px-1">
            Danger Zone
          </h2>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-red-200 dark:border-red-900/60 shadow-soft p-7">
            <DeleteAccountDanger gymName={gym.name} />
          </div>
        </section>
      </div>
    </div>
  );
}
