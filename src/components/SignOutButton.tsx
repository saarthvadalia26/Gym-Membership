"use client";

import { LogOut } from "lucide-react";
import { signOutAction } from "@/app/actions";

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 transition"
      >
        <LogOut size={16} />
        Sign out
      </button>
    </form>
  );
}
