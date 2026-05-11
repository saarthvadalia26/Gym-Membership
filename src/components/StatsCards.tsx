"use client";

import { Users, TrendingUp, Clock, CalendarClock } from "lucide-react";
import { formatINRCompact } from "@/lib/currency";
import { motion } from "framer-motion";

interface Stats {
  totalMembers: number;
  mrrPaise: number;
  expiringThisWeek: number;
  expectedNext30DaysPaise: number;
}

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

export function StatsCards({ stats }: { stats: Stats }) {
  const cards = [
    {
      label: "Total Members",
      value: stats.totalMembers.toString(),
      icon: Users,
      tint: "bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400",
    },
    {
      label: "Monthly Recurring Revenue",
      value: formatINRCompact(stats.mrrPaise),
      icon: TrendingUp,
      tint: "bg-emerald-950/60 text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Expiring This Week",
      value: stats.expiringThisWeek.toString(),
      icon: Clock,
      tint: "bg-amber-950/60 text-amber-600 dark:text-amber-400",
    },
    {
      label: "Expected Next 30 Days",
      value: formatINRCompact(stats.expectedNext30DaysPaise),
      icon: CalendarClock,
      tint: "bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400",
    },
  ];

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
    >
      {cards.map(({ label, value, icon: Icon, tint }) => (
        <motion.div
          key={label}
          variants={item}
          whileHover={{ y: -4, scale: 1.02 }}
          className="group bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-soft hover:shadow-glow transition-shadow duration-200"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {label}
            </div>
            <div className={`p-2 rounded-lg ${tint} group-hover:scale-110 transition-transform`}>
              <Icon size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            {value}
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

