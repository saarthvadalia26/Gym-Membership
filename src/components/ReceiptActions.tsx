"use client";

import { Download, Send, X } from "lucide-react";
import { useState } from "react";

interface Props {
  subscriptionId: string;
  whatsappUrl: string;
}

export function ReceiptActions({ subscriptionId, whatsappUrl }: Props) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="bg-emerald-950/40 border border-emerald-800 rounded-xl p-5 mb-6 relative">
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 text-emerald-400 hover:text-emerald-900"
        aria-label="Dismiss"
      >
        <X size={16} />
      </button>
      <div className="font-semibold text-emerald-200 mb-1">
        ✓ Subscription created. Send the receipt:
      </div>
      <div className="text-sm text-emerald-400 mb-4">
        Download a PDF copy or share the receipt with the member on WhatsApp.
      </div>
      <div className="flex gap-3 flex-wrap">
        <a
          href={`/api/receipt/${subscriptionId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-slate-900 border border-emerald-700 hover:bg-emerald-950/60 text-emerald-300 font-medium px-4 py-2 rounded-lg transition"
        >
          <Download size={16} />
          Download PDF
        </a>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2 rounded-lg transition"
        >
          <Send size={16} />
          Send via WhatsApp
        </a>
      </div>
    </div>
  );
}
