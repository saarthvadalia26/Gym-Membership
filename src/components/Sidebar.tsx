"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  Tag,
  ScanLine,
  Settings,
  Menu,
  X,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

const allLinks = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, ownerOnly: false },
  { href: "/members", label: "Members", icon: Users, ownerOnly: false },
  { href: "/plans", label: "Plans", icon: Tag, ownerOnly: true },
  { href: "/checkin", label: "Check-in", icon: ScanLine, ownerOnly: false },
];

interface SidebarProps {
  gymName: string;
  role?: "OWNER" | "TRAINER";
}

export function Sidebar({ gymName, role = "OWNER" }: SidebarProps) {
  const links = allLinks.filter((l) => !l.ownerOnly || role === "OWNER");
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Close drawer on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  function openCommandPalette() {
    window.dispatchEvent(new Event("open-command-palette"));
  }

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <Image
            src="/logo.svg"
            alt={gymName}
            width={32}
            height={32}
            className="rounded-lg"
            priority
          />
          <div className="font-bold text-slate-900 dark:text-slate-100 truncate">
            {gymName}
          </div>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>
      </div>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed lg:sticky top-0 left-0 z-50 w-64 shrink-0 h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="px-6 py-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <Image
              src="/logo.svg"
              alt={gymName}
              width={44}
              height={44}
              className="rounded-xl shadow-glow shrink-0"
              priority
            />
            <div className="min-w-0">
              <div className="font-bold text-slate-900 dark:text-slate-100 truncate leading-tight">
                {gymName}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Membership
              </div>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-3 pt-3">
          <button
            onClick={openCommandPalette}
            className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition"
          >
            <span className="flex items-center gap-2">
              <Search size={14} />
              Quick search…
            </span>
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-500">
              ⌘K
            </kbd>
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {links.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                  active
                    ? "bg-brand-400 text-slate-950 shadow-glow hover:bg-brand-300 font-bold"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
          <Link
            href="/settings"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition",
              pathname.startsWith("/settings")
                ? "bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            <Settings size={18} />
            Settings
          </Link>
        </div>
      </aside>
    </>
  );
}
