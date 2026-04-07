// Single source of truth for member status. Always derive from endDate so the
// dashboard reflects reality even if the nightly cron hasn't run yet.

export type Status = "GREEN" | "YELLOW" | "RED";

export const STATUS_LABEL: Record<Status, string> = {
  GREEN: "Active",
  YELLOW: "Expiring Soon",
  RED: "Expired",
};

export const YELLOW_THRESHOLD_DAYS = 5;

export function computeStatus(endDate: Date | string, today: Date = new Date()): Status {
  const end = typeof endDate === "string" ? new Date(endDate) : endDate;
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  const days = Math.floor((startOfEnd.getTime() - startOfToday.getTime()) / 86400000);
  if (days < 0) return "RED";
  if (days <= YELLOW_THRESHOLD_DAYS) return "YELLOW";
  return "GREEN";
}

export function daysRemaining(endDate: Date | string, today: Date = new Date()): number {
  const end = typeof endDate === "string" ? new Date(endDate) : endDate;
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.floor((startOfEnd.getTime() - startOfToday.getTime()) / 86400000);
}
