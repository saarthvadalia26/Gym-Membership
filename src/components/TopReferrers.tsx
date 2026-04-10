import Link from "next/link";
import { Trophy, Gift } from "lucide-react";

interface TopReferrer {
  id: string;
  fullName: string;
  referralCode: string | null;
  count: number;
}

interface Props {
  referrers: TopReferrer[];
}

export function TopReferrers({ referrers }: Props) {
  if (referrers.length === 0) return null;

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-soft p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-amber-950/40 flex items-center justify-center">
          <Trophy size={15} className="text-amber-600" />
        </div>
        <h2 className="font-semibold text-slate-100">
          Top Referrers
        </h2>
      </div>

      <div className="space-y-2">
        {referrers.map((r, idx) => {
          const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : "";
          return (
            <Link
              key={r.id}
              href={`/members/${r.id}`}
              className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg hover:bg-slate-800/50 transition group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xl shrink-0 w-6 text-center">
                  {medal || (
                    <span className="text-xs font-bold text-slate-400">
                      {idx + 1}
                    </span>
                  )}
                </span>
                <div className="min-w-0">
                  <div className="font-medium text-slate-100 truncate group-hover:text-brand-400 transition">
                    {r.fullName}
                  </div>
                  {r.referralCode && (
                    <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                      {r.referralCode}
                    </div>
                  )}
                </div>
              </div>
              <div className="inline-flex items-center gap-1 text-sm font-bold text-slate-200 shrink-0">
                <Gift size={12} className="text-brand-500" />
                {r.count}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
