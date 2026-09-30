import { Status, STATUS_LABEL } from "@/lib/status";
import { cn } from "@/lib/utils";

const styles: Record<Status, string> = {
  GREEN:
    "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800 ",
  YELLOW:
    "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800 ",
  RED:
    "bg-red-100 text-red-700 border-red-200 dark:bg-red-950/60 dark:text-red-400 dark:border-red-800 ",
};

const dotStyles: Record<Status, string> = {
  GREEN: "bg-emerald-500 dark:bg-emerald-400",
  YELLOW: "bg-amber-500 dark:bg-amber-400",
  RED: "bg-red-500 dark:bg-red-400",
};

export function StatusBadge({
  status,
  className,
}: {
  status: Status;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold",
        styles[status],
        className
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", dotStyles[status])} />
      {STATUS_LABEL[status]}
    </span>
  );
}
