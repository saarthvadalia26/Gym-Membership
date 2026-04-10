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
  const u = session?.user as
    | { gymId?: string; role?: string }
    | undefined;
  if (!u?.gymId) redirect("/login");

  const gym = await prisma.gym.findUnique({
    where: { id: u.gymId },
    select: { name: true },
  });
  if (!gym) redirect("/login");

  const role = u.role === "TRAINER" ? "TRAINER" : "OWNER";

  return (
    <div className="lg:flex min-h-screen bg-[#0f172a]">
      <Sidebar gymName={gym.name} role={role} />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-auto">{children}</main>
      <CommandPalette />
    </div>
  );
}
