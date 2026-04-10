import { prisma } from "@/lib/db";
import { requireGymId } from "@/lib/auth";
import { PlansManager } from "@/components/PlansManager";

export const dynamic = "force-dynamic";

export default async function PlansPage() {
  const gymId = await requireGymId();
  const plans = await prisma.plan.findMany({
    where: { gymId },
    orderBy: { durationDays: "asc" },
  });

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-100 tracking-tight">
          Plans
        </h1>
        <p className="text-sm text-slate-400 mt-1.5">
          Define the membership plans members can subscribe to.
        </p>
      </div>
      <PlansManager initialPlans={plans} />
    </div>
  );
}
