import Link from "next/link";
import { Cake, MessageCircle } from "lucide-react";
import { differenceInYears, format } from "date-fns";
import { normalizePhoneForWhatsApp } from "@/lib/whatsapp";

interface BirthdayMember {
  id: string;
  fullName: string;
  phoneNumber: string;
  dateOfBirth: Date;
}

interface Props {
  members: BirthdayMember[];
  gymName: string;
}

function buildBirthdayWhatsApp(
  m: BirthdayMember,
  gymName: string
): string {
  const phone = normalizePhoneForWhatsApp(m.phoneNumber);
  const message = encodeURIComponent(
    [
      `🎂 Happy Birthday, ${m.fullName.split(" ")[0]}!`,
      ``,
      `Wishing you a fantastic year ahead from all of us at *${gymName}*. Keep crushing those goals 💪`,
      ``,
      `— ${gymName}`,
    ].join("\n")
  );
  return `https://wa.me/${phone}?text=${message}`;
}

export function BirthdaysToday({ members, gymName }: Props) {
  if (members.length === 0) return null;

  const today = new Date();

  return (
    <div className="bg-gradient-to-br from-pink-950/30 to-amber-950/30 rounded-2xl border border-pink-900/60 shadow-soft p-5 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-full bg-pink-950/60 flex items-center justify-center">
          <Cake size={16} className="text-pink-600" />
        </div>
        <h2 className="font-semibold text-slate-100">
          {members.length === 1
            ? "1 birthday today"
            : `${members.length} birthdays today`}
        </h2>
      </div>

      <div className="space-y-2">
        {members.map((m) => {
          const dob = new Date(m.dateOfBirth);
          const turning = differenceInYears(today, dob);
          return (
            <div
              key={m.id}
              className="flex items-center justify-between gap-3 bg-white/70/60 rounded-xl px-4 py-3 border border-pink-100"
            >
              <Link
                href={`/members/${m.id}`}
                className="flex items-center gap-3 min-w-0 flex-1 hover:text-brand-400 transition"
              >
                <span className="text-2xl shrink-0">🎂</span>
                <div className="min-w-0">
                  <div className="font-semibold text-slate-100 truncate">
                    {m.fullName}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Turning {turning} • {format(dob, "dd MMM")}
                  </div>
                </div>
              </Link>
              <a
                href={buildBirthdayWhatsApp(m, gymName)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-full transition shadow-sm shrink-0"
              >
                <MessageCircle size={12} />
                Wish
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}
