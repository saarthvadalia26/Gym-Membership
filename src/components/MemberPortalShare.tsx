"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Link as LinkIcon,
  Copy,
  MessageCircle,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { normalizePhoneForWhatsApp } from "@/lib/whatsapp";

interface Props {
  memberId: string;
  memberName: string;
  memberPhone: string;
  initialAccessToken: string | null;
  gymName: string;
  qrCode?: ReactNode;
}

export function MemberPortalShare({
  memberId,
  memberName,
  memberPhone,
  initialAccessToken,
  gymName,
  qrCode,
}: Props) {
  const router = useRouter();
  const [token, setToken] = useState(initialAccessToken);
  const [busy, setBusy] = useState(false);

  const portalUrl =
    typeof window !== "undefined" && token
      ? `${window.location.origin}/m/${token}`
      : token
      ? `/m/${token}`
      : "";

  async function generateOrRotate() {
    setBusy(true);
    const res = await fetch(`/api/members/${memberId}/access-token`, {
      method: "POST",
    });
    if (!res.ok) {
      toast.error("Could not generate link");
      setBusy(false);
      return;
    }
    const data = await res.json();
    setToken(data.accessToken);
    toast.success(initialAccessToken ? "Link rotated" : "Link generated");
    setBusy(false);
    router.refresh();
  }

  function copyLink() {
    if (!portalUrl) return;
    navigator.clipboard.writeText(portalUrl);
    toast.success("Link copied to clipboard");
  }

  function buildWhatsAppShare(): string {
    const phone = normalizePhoneForWhatsApp(memberPhone);
    const message = encodeURIComponent(
      [
        `Hi ${memberName},`,
        ``,
        `Here's your private *${gymName}* membership page where you can check your plan, expiry, and download payment receipts:`,
        ``,
        portalUrl,
        ``,
        `Save it as a bookmark — keep it private to you.`,
      ].join("\n")
    );
    return `https://wa.me/${phone}?text=${message}`;
  }

  if (!token) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-soft p-6">
        <div className="flex items-center gap-2 mb-2">
          <LinkIcon size={14} className="text-brand-500" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Member Portal
          </h2>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
          Generate a private link this member can use to view their plan,
          expiry date, and payment receipts. No login needed for them.
        </p>
        <button
          onClick={generateOrRotate}
          disabled={busy}
          className="inline-flex items-center gap-2 bg-brand-400 hover:bg-brand-300 disabled:opacity-60 text-slate-950 text-sm font-semibold px-4 py-2 rounded-lg transition shadow-sm"
        >
          <LinkIcon size={14} />
          {busy ? "Generating…" : "Generate Portal Link"}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-soft p-6">
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <LinkIcon size={14} className="text-brand-500" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Member Portal & QR
          </h2>
        </div>
        <button
          onClick={generateOrRotate}
          disabled={busy}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
          title="Rotate the link (old one stops working)"
        >
          <RefreshCw size={11} className={busy ? "animate-spin" : ""} />
          Rotate
        </button>
      </div>

      {qrCode && (
        <div className="flex flex-col items-center bg-slate-800/30 border border-slate-300 dark:border-slate-700 rounded-xl p-4 mb-3">
          <div className="bg-white dark:bg-slate-900 p-2 rounded-lg">{qrCode}</div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center">
            Member shows this QR at the door for instant check-in
          </p>
        </div>
      )}

      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 mb-3 overflow-hidden">
        <code className="text-xs text-slate-700 dark:text-slate-300 truncate flex-1 min-w-0">
          {portalUrl}
        </code>
        <button
          onClick={copyLink}
          className="p-1.5 text-slate-500 hover:text-brand-400 hover:bg-white dark:bg-slate-900 rounded transition shrink-0"
          title="Copy link"
        >
          <Copy size={14} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <a
          href={buildWhatsAppShare()}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition shadow-sm"
        >
          <MessageCircle size={13} />
          Send via WhatsApp
        </a>
        <a
          href={portalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold px-3 py-2 rounded-lg transition"
        >
          <ExternalLink size={13} />
          Preview
        </a>
      </div>
    </div>
  );
}
