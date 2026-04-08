-- Add referral credit counter to Member.
-- Each credit = one 10% discount usable on a subscription.
-- New referred members get 1 credit on signup; their referrer gets +1 when
-- the referred member buys their first subscription.
ALTER TABLE "Member"
ADD COLUMN "referralCreditsAvailable" INTEGER NOT NULL DEFAULT 0;
