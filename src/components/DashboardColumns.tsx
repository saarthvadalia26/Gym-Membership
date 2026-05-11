"use client";

import Link from "next/link";
import { format } from "date-fns";
import { MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { StatusBadge } from "@/components/StatusBadge";
import { Status } from "@/lib/status";
import { buildWhatsAppReminderLink } from "@/lib/whatsapp";

type Row = {
  id: string;
  name: string;
  phone: string;
  plan: string;
  endDate: Date;
  days: number;
  pricePaise: number;
};

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 },
};

export function DashboardColumns({
  buckets,
  gymName,
}: {
  buckets: Record<Status, Row[]>;
  gymName: string;
}) {
  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 lg:grid-cols-3 gap-6"
    >
      <Column
        title="Expired / Overdue"
        status="RED"
        rows={buckets.RED}
        emptyText="No expired members. 🎉"
        gymName={gymName}
      />
      <Column
        title="Expiring Soon (≤5 days)"
        status="YELLOW"
        rows={buckets.YELLOW}
        emptyText="No renewals due this week."
        gymName={gymName}
      />
      <Column
        title="Active"
        status="GREEN"
        rows={buckets.GREEN}
        emptyText="No active members yet."
        gymName={gymName}
      />
    </motion.div>
  );
}

function Column({
  title,
  status,
  rows,
  emptyText,
  gymName,
}: {
  title: string;
  status: Status;
  rows: Row[];
  emptyText: string;
  gymName: string;
}) {
  const headerStyle =
    status === "RED"
      ? "bg-red-50 dark:bg-red-950/30 border-red-900"
      : status === "YELLOW"
      ? "bg-amber-50 dark:bg-amber-950/30 border-amber-900"
      : "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-900";

  const accentBar =
    status === "RED"
      ? "bg-red-500"
      : status === "YELLOW"
      ? "bg-amber-500"
      : "bg-emerald-500";

  return (
    <motion.div 
      variants={item}
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-soft overflow-hidden flex flex-col h-full"
    >
      <div className={`px-5 py-3.5 border-b ${headerStyle} relative`}>
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${accentBar}`} />
        <div className="flex items-center justify-between pl-2">
          <h2 className="font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
          <span className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-full bg-slate-800/80 text-sm font-bold text-slate-100 shadow-sm">
            {rows.length}
          </span>
        </div>
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[640px] overflow-y-auto flex-1 custom-scrollbar">
        {rows.length === 0 && (
          <div className="px-5 py-10 text-sm text-center text-slate-500">
            {emptyText}
          </div>
        )}
        {rows.map((r) => (
          <div
            key={r.id}
            className="group px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors relative"
          >
            <Link href={`/members/${r.id}`} className="block">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-slate-900 dark:text-slate-100 truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                    {r.name}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {r.plan} • ends {format(r.endDate, "dd MMM")}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <StatusBadge status={status} />
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {r.days < 0
                      ? `${Math.abs(r.days)}d ago`
                      : r.days === 0
                      ? "today"
                      : `${r.days}d left`}
                  </div>
                </div>
              </div>
            </Link>
            {status === "RED" && (
              <motion.a
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                href={buildWhatsAppReminderLink({
                  memberName: r.name,
                  memberPhone: r.phone,
                  planName: r.plan,
                  endDate: r.endDate,
                  daysOverdue: Math.abs(r.days),
                  gymName: gymName,
                })}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-full transition-all"
                title="Send WhatsApp renewal reminder"
              >
                <MessageCircle size={12} />
                Send Reminder
              </motion.a>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}
