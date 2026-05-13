import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      fill="none"
      className={cn("text-slate-900 dark:text-white", className)}
    >
      <rect width="64" height="64" rx="16" fill="currentColor" />
      <g
        stroke="var(--background, #ffffff)"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      >
        <path d="M14 26v12" />
        <path d="M50 26v12" />
        <path d="M19 22v20" />
        <path d="M45 22v20" />
        <path d="M19 32h26" />
      </g>
      <circle cx="32" cy="32" r="3" fill="var(--background, #ffffff)" />
    </svg>
  );
}
