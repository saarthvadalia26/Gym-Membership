import { differenceInDays, format } from "date-fns";

interface Props {
  checkIns: { timestamp: Date }[];
  days?: number;
}

/**
 * 14-day mini bar chart of check-ins per day. Pure SVG, no client JS.
 */
export function CheckinSparkline({ checkIns, days = 14 }: Props) {
  const today = new Date();
  const buckets: { date: Date; count: number }[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    buckets.push({ date: d, count: 0 });
  }

  for (const c of checkIns) {
    const t = new Date(c.timestamp);
    const ageDays = differenceInDays(today, t);
    if (ageDays >= 0 && ageDays < days) {
      const idx = days - 1 - ageDays;
      if (buckets[idx]) buckets[idx].count++;
    }
  }

  const max = Math.max(...buckets.map((b) => b.count), 1);
  const totalVisits = buckets.reduce((acc, b) => acc + b.count, 0);
  const lastVisit = checkIns.length > 0 ? checkIns[0].timestamp : null;

  return (
    <div>
      <div className="flex items-end gap-1 h-12">
        {buckets.map((b, i) => {
          const h = b.count === 0 ? 8 : 8 + (b.count / max) * 36;
          const isToday = i === buckets.length - 1;
          return (
            <div
              key={i}
              className="flex-1 group relative flex items-end"
              title={`${format(b.date, "dd MMM")}: ${b.count} check-in${b.count === 1 ? "" : "s"}`}
            >
              <div
                className={`w-full rounded ${
                  b.count === 0
                    ? "bg-slate-200 dark:bg-slate-700"
                    : isToday
                    ? "bg-brand-500"
                    : "bg-brand-400 dark:bg-brand-500"
                }`}
                style={{ height: `${h}px` }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between mt-3 text-xs">
        <span className="text-slate-500 dark:text-slate-400">
          <strong className="text-slate-900 dark:text-slate-100">{totalVisits}</strong> visits in past {days} days
        </span>
        {lastVisit && (
          <span className="text-slate-500 dark:text-slate-400">
            Last: {format(lastVisit, "dd MMM")}
          </span>
        )}
      </div>
    </div>
  );
}
