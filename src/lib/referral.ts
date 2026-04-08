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
 * Normalize user input for matching: uppercase, strip whitespace.
 * Accepts both `IRON-7K9P` and `iron 7k9p` and `IRON7K9P`.
 */
export function normalizeReferralCode(input: string): string {
  return input.replace(/\s+/g, "").toUpperCase();
}
