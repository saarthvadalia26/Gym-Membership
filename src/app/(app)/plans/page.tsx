import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { PlansManager } from "@/components/PlansManager";

export const dynamic = "force-dynamic";

export default async function PlansPage() {
  const ctx = await requireSession();
  if (ctx.role !== "OWNER") {
    redirect("/");
  }
  const plans = await prisma.plan.findMany({
    where: { gymId: ctx.gymId },
    orderBy: { durationDays: "asc" },
  });

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Plans
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
          Define the membership plans members can subscribe to.
        </p>
      </div>
      <PlansManager initialPlans={plans} />
    </div>
  );
}
