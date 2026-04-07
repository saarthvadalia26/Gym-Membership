"use client";

import { Command } from "cmdk";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Tag,
  ScanLine,
  Settings,
  UserPlus,
  Sun,
  Moon,
  Search,
  LogOut,
} from "lucide-react";
import { useTheme } from "next-themes";
import { signOutAction } from "@/app/actions";

interface MemberHit {
  id: string;
  fullName: string;
  phoneNumber: string;
}

export function CommandPalette() {
  const router = useRouter();
  const { setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [members, setMembers] = useState<MemberHit[]>([]);

  // Open with Cmd+K / Ctrl+K
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Listen for global open event so the sidebar button can trigger it
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("open-command-palette", handler);
    return () => window.removeEventListener("open-command-palette", handler);
  }, []);

  // Debounced member search
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(async () => {
      const res = await fetch(
        `/api/members${search ? `?q=${encodeURIComponent(search)}` : ""}`
      );
      if (res.ok) {
        const data = await res.json();
        setMembers(data.slice(0, 6));
      }
    }, 150);
    return () => clearTimeout(t);
  }, [open, search]);

  const go = useCallback(
    (path: string) => {
      setOpen(false);
      router.push(path);
    },
    [router]
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4 animate-fade-in">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-slide-up">
        <Command label="Command palette" loop>
          <div className="flex items-center gap-3 px-4 border-b border-slate-200 dark:border-slate-700">
            <Search size={18} className="text-slate-400 shrink-0" />
            <Command.Input
              placeholder="Search members or jump to a page…"
              value={search}
              onValueChange={setSearch}
              autoFocus
            />
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono border border-slate-200 dark:border-slate-700 text-slate-500 shrink-0">
              ESC
            </kbd>
          </div>

          <Command.List>
            <Command.Empty>No results found.</Command.Empty>

            {members.length > 0 && (
              <Command.Group heading="Members">
                {members.map((m) => (
                  <Command.Item
                    key={m.id}
                    value={`member-${m.id}-${m.fullName}-${m.phoneNumber}`}
                    onSelect={() => go(`/members/${m.id}`)}
                  >
                    <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300 flex items-center justify-center font-semibold text-xs shrink-0">
                      {m.fullName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-slate-900 dark:text-slate-100 truncate">
                        {m.fullName}
                      </div>
                      <div className="text-xs text-slate-500 truncate">
                        {m.phoneNumber}
                      </div>
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            <Command.Group heading="Navigation">
              <Command.Item value="dashboard home" onSelect={() => go("/")}>
                <LayoutDashboard size={16} className="text-slate-500" />
                Go to Dashboard
              </Command.Item>
              <Command.Item value="members list" onSelect={() => go("/members")}>
                <Users size={16} className="text-slate-500" />
                Go to Members
              </Command.Item>
              <Command.Item value="plans" onSelect={() => go("/plans")}>
                <Tag size={16} className="text-slate-500" />
                Go to Plans
              </Command.Item>
              <Command.Item value="checkin check-in" onSelect={() => go("/checkin")}>
                <ScanLine size={16} className="text-slate-500" />
                Go to Check-in
              </Command.Item>
              <Command.Item value="settings" onSelect={() => go("/settings")}>
                <Settings size={16} className="text-slate-500" />
                Go to Settings
              </Command.Item>
            </Command.Group>

            <Command.Group heading="Actions">
              <Command.Item
                value="new member create add"
                onSelect={() => go("/members/new")}
              >
                <UserPlus size={16} className="text-emerald-500" />
                Create new member
              </Command.Item>
              <Command.Item
                value="theme light mode"
                onSelect={() => {
                  setTheme("light");
                  setOpen(false);
                }}
              >
                <Sun size={16} className="text-amber-500" />
                Switch to Light theme
              </Command.Item>
              <Command.Item
                value="theme dark mode"
                onSelect={() => {
                  setTheme("dark");
                  setOpen(false);
                }}
              >
                <Moon size={16} className="text-indigo-400" />
                Switch to Dark theme
              </Command.Item>
              <Command.Item
                value="sign out logout logoff"
                onSelect={() => {
                  setOpen(false);
                  signOutAction();
                }}
              >
                <LogOut size={16} className="text-red-500" />
                Sign out
              </Command.Item>
            </Command.Group>
          </Command.List>

          <div className="border-t border-slate-200 dark:border-slate-700 px-4 py-2.5 flex items-center justify-between text-[11px] text-slate-500">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 rounded border border-slate-200 dark:border-slate-700 font-mono">↑↓</kbd>
                navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 rounded border border-slate-200 dark:border-slate-700 font-mono">↵</kbd>
                select
              </span>
            </div>
            <span className="font-semibold text-slate-400">⌘K</span>
          </div>
        </Command>
      </div>
    </div>
  );
}
