import { format } from "date-fns";
import { formatINRCompact } from "./currency";

interface WhatsAppReceiptInput {
  memberName: string;
  memberPhone: string;
  planName: string;
  endDate: Date;
  originalPricePaise?: number | null;
  pricePaidPaise: number;
  receiptUrl?: string;
  gymName: string;
}

/** Builds a wa.me share link with a prefilled receipt message. Trainer clicks Send manually. */
export function buildWhatsAppReceiptLink(input: WhatsAppReceiptInput): string {
  const phone = normalizePhoneForWhatsApp(input.memberPhone);
  const subtotal = input.originalPricePaise ?? input.pricePaidPaise;
  const discount = Math.max(subtotal - input.pricePaidPaise, 0);
  const hasDiscount = discount > 0;
  const discountPercent =
    hasDiscount && subtotal > 0 ? Math.round((discount / subtotal) * 100) : 0;

  const lines = [
    `Hi ${input.memberName},`,
    ``,
    `Thank you for renewing your *${input.planName}* membership at *${input.gymName}*.`,
    ``,
  ];

  if (hasDiscount) {
    lines.push(
      `Subtotal: ${formatINRCompact(subtotal)}`,
      `Discount${discountPercent > 0 ? ` (${discountPercent}%)` : ""}: − ${formatINRCompact(discount)}`,
      `*Total paid: ${formatINRCompact(input.pricePaidPaise)}*`
    );
  } else {
    lines.push(`Amount paid: ${formatINRCompact(input.pricePaidPaise)}`);
  }

  lines.push(`Valid till: ${format(input.endDate, "dd MMM yyyy")}`);

  if (input.receiptUrl) {
    lines.push(``, `Receipt: ${input.receiptUrl}`);
  }
  lines.push(``, `See you at the gym!`);

  const message = encodeURIComponent(lines.join("\n"));
  return `https://wa.me/${phone}?text=${message}`;
}

/** Strips +, spaces, dashes from a phone number for use in wa.me URLs. */
export function normalizePhoneForWhatsApp(phone: string): string {
  return phone.replace(/[^\d]/g, "");
}

interface WhatsAppReminderInput {
  memberName: string;
  memberPhone: string;
  planName: string;
  endDate: Date;
  daysOverdue: number;
  gymName: string;
}

/** Builds a wa.me link with a prefilled "please renew" reminder for expired members. */
export function buildWhatsAppReminderLink(input: WhatsAppReminderInput): string {
  const phone = normalizePhoneForWhatsApp(input.memberPhone);
  const overdueText =
    input.daysOverdue <= 0
      ? "has just expired"
      : `expired ${input.daysOverdue} day${input.daysOverdue === 1 ? "" : "s"} ago`;

  const lines = [
    `Hi ${input.memberName},`,
    ``,
    `Just a friendly reminder — your *${input.planName}* membership at *${input.gymName}* ${overdueText} (${format(input.endDate, "dd MMM yyyy")}).`,
    ``,
    `Drop by the reception any time to renew and continue your fitness journey. We'd love to see you back!`,
    ``,
    `— ${input.gymName}`,
  ];

  const message = encodeURIComponent(lines.join("\n"));
  return `https://wa.me/${phone}?text=${message}`;
}
