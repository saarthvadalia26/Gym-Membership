// All money is stored as integer paise. Format only at display time.

const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

export function formatINR(paise: number): string {
  return inrFormatter.format(paise / 100);
}

export function formatINRCompact(paise: number): string {
  // ₹1,500 instead of ₹1,500.00 when there are no paise
  if (paise % 100 === 0) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(paise / 100);
  }
  return formatINR(paise);
}

/** Parses "1500", "1,500", "1500.50", "₹1,500" → integer paise. Returns null on invalid input. */
export function parseINR(input: string): number | null {
  const cleaned = input.replace(/[₹,\s]/g, "").trim();
  if (cleaned === "") return null;
  const num = Number(cleaned);
  if (!Number.isFinite(num) || num < 0) return null;
  return Math.round(num * 100);
}
