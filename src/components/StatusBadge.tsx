import { Status, STATUS_LABEL } from "@/lib/status";
import { cn } from "@/lib/utils";

const styles: Record<Status, string> = {
  GREEN:
    "bg-emerald-950/60 text-emerald-400 border-emerald-800 ",
  YELLOW:
    "bg-amber-950/60 text-amber-400 border-amber-800 ",
  RED:
    "bg-red-950/60 text-red-400 border-red-800 ",
};

const dotStyles: Record<Status, string> = {
  GREEN: "bg-emerald-950/400",
  YELLOW: "bg-amber-950/400",
  RED: "bg-red-950/400",
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
