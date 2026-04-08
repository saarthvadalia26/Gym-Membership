"use client";

import { useEffect } from "react";

export default function MemberPortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface the real error in the browser console for debugging.
    console.error("[member-portal] client error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-soft p-6 text-center">
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Could not load this member page
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
          {error.message || "Unknown error"}
        </p>
        {error.digest && (
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
            Reference: {error.digest}
          </p>
        )}
        <button
          type="button"
          onClick={reset}
          className="mt-5 inline-flex items-center justify-center px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition shadow-sm"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
