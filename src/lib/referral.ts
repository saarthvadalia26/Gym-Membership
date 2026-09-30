/**
 * Generates a short, human-friendly referral code like "IRON-7K9P".
 *
 * Prefix: 1st 4 letters of the gym name (uppercase, alphanumeric only).
 * Suffix: 4 random base32-ish characters (no easily-confused 0/O/1/I/L).
 */

/** Discount applied per referral credit (in percent). */
export const REFERRAL_DISCOUNT_PERCENT = 10;

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // omits 0, 1, I, O, L

function randomSuffix(length = 4): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return out;
}

function gymPrefix(gymName: string): string {
  const cleaned = gymName.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  if (cleaned.length === 0) return "GYM";
  return cleaned.slice(0, 4);
}

export function generateReferralCode(gymName: string): string {
  return `${gymPrefix(gymName)}-${randomSuffix(4)}`;
}

/**
 * Normalize user input for matching: uppercase, strip whitespace, and normalize hyphen.
 * Accepts `IRON-7K9P`, `iron 7k9p`, and `IRON7K9P`.
 */
export function normalizeReferralCode(input: string): string {
  const stripped = input.replace(/[\s-]+/g, "").toUpperCase();
  if (stripped.length > 4) {
    return `${stripped.slice(0, stripped.length - 4)}-${stripped.slice(stripped.length - 4)}`;
  }
  return stripped;
}

/**
 * Returns candidate string variants for a referral code query
 * so queries match regardless of hyphenation or spacing.
 */
export function getReferralCodeVariants(input: string): string[] {
  const raw = input.trim().toUpperCase();
  const stripped = raw.replace(/[\s-]+/g, "");
  const normalized = normalizeReferralCode(input);

  const variants = new Set<string>();
  if (raw) variants.add(raw);
  if (stripped) variants.add(stripped);
  if (normalized) variants.add(normalized);
  return Array.from(variants);
}
