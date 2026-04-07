import Link from "next/link";
import { Plus, Download, Users as UsersIcon, Search } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireGymId } from "@/lib/auth";
import { computeStatus } from "@/lib/status";
import { StatusBadge } from "@/components/StatusBadge";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const gymId = await requireGymId();
  const { q = "" } = await searchParams;

  const where = q
    ? {
        gymId,
        OR: [
          { fullName: { contains: q } },
          { phoneNumber: { contains: q } },
        ],
      }
    : { gymId };

  const members = await prisma.member.findMany({
    where,
    orderBy: { fullName: "asc" },
    include: {
      subscriptions: {
        orderBy: { endDate: "desc" },
        take: 1,
        include: { plan: true },
      },
    },
  });

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Members
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
            {members.length} total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/api/members/export"
            className="inline-flex items-center gap-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium px-4 py-2.5 rounded-lg transition border border-slate-200 dark:border-slate-700"
          >
            <Download size={16} /> Export CSV
          </a>
          <Link
            href="/members/new"
            className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 hover:shadow-glow text-white font-medium px-4 py-2.5 rounded-lg transition shadow-sm"
          >
            <Plus size={16} /> New Member
          </Link>
        </div>
      </div>

      <form method="get" className="mb-4 relative max-w-md">
        <Search
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by name or phone…"
          className="w-full pl-10 pr-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
        />
      </form>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-soft overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider">
            <tr>
              <th className="text-left px-5 py-3.5 font-semibold">Name</th>
              <th className="text-left px-5 py-3.5 font-semibold">Phone</th>
              <th className="text-left px-5 py-3.5 font-semibold">Current Plan</th>
              <th className="text-left px-5 py-3.5 font-semibold">Expires</th>
              <th className="text-left px-5 py-3.5 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {members.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <UsersIcon size={24} className="text-slate-400" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-700 dark:text-slate-200">
                        {q ? `No members match "${q}"` : "No members yet"}
                      </div>
                      <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        {q
                          ? "Try a different name or phone number."
                          : "Add your first member to get started."}
                      </div>
                    </div>
                    {!q && (
                      <Link
                        href="/members/new"
                        className="mt-2 inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-medium px-4 py-2 rounded-lg transition text-sm"
                      >
                        <Plus size={14} /> Add First Member
                      </Link>
                    )}
                  </div>
                </td>
              </tr>
            )}
            {members.map((m) => {
              const sub = m.subscriptions[0];
              const status = sub ? computeStatus(sub.endDate) : null;
              return (
                <tr
                  key={m.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
                >
                  <td className="px-5 py-3.5">
                    <Link
                      href={`/members/${m.id}`}
                      className="flex items-center gap-3"
                    >
                      <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 flex items-center justify-center font-semibold text-xs">
                        {m.fullName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <span className="font-medium text-slate-900 dark:text-slate-100 hover:text-brand-600 dark:hover:text-brand-400 transition">
                        {m.fullName}
                      </span>
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">
                    {m.phoneNumber}
                  </td>
                  <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">
                    {sub?.plan.name ?? "—"}
                  </td>
                  <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">
                    {sub ? format(sub.endDate, "dd MMM yyyy") : "—"}
                  </td>
                  <td className="px-5 py-3.5">
                    {status ? (
                      <StatusBadge status={status} />
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500 text-xs">
                        No subscription
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
