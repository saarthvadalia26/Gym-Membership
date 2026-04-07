import { redirect } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { CommandPalette } from "@/components/CommandPalette";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const gymId = (session?.user as { gymId?: string } | undefined)?.gymId;
  if (!gymId) redirect("/login");

  const gym = await prisma.gym.findUnique({
    where: { id: gymId },
    select: { name: true },
  });
  if (!gym) redirect("/login");

  return (
    <div className="lg:flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-brand-50/30 dark:from-[#0b1020] dark:via-[#0b1020] dark:to-[#1a1340]/40">
      <Sidebar gymName={gym.name} />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-auto">{children}</main>
      <CommandPalette />
    </div>
  );
}
