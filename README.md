# Gym Subscription Management

A Next.js + Prisma web app for managing gym/club memberships. Replaces the spreadsheet with a traffic-light dashboard, a front-desk check-in screen, and one-click PDF/WhatsApp receipts.

## Phase 1 features

- **Traffic-light dashboard** — Green (active), Yellow (expiring within 5 days), Red (expired/overdue), all derived live from `endDate`.
- **MRR + revenue stats** — total members, monthly recurring revenue (normalised across mixed plan durations), expiring this week, expected next-30-day collections.
- **Front-desk check-in** — big search bar, instant ALLOW/DENY card, every check-in is logged.
- **Receipts** — generate a clean PDF and a prefilled WhatsApp share link the moment a payment is recorded.
- **Auto-expire cron** — nightly job flips `Active → Expired` rows so reports stay accurate.
- **Single admin login** — credentials provider seeded from `.env`.

## Tech stack

Next.js 15 (App Router) · TypeScript · Prisma + SQLite · Tailwind CSS · Auth.js v5 · @react-pdf/renderer · date-fns

## Setup

```bash
# 1. Install deps (this also runs `prisma generate` via postinstall)
npm install

# 2. Copy env template and edit it
cp .env.example .env
# then open .env and set: NEXTAUTH_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD,
# CRON_SECRET, GYM_NAME, GYM_ADDRESS, GYM_PHONE

# 3. Create the database and seed admin user + default plans
npx prisma migrate dev --name init
npm run db:seed

# 4. Run dev server
npm run dev
```

Open <http://localhost:3000> and sign in with the `ADMIN_EMAIL` / `ADMIN_PASSWORD` you set in `.env`.

## End-to-end verification

After setup, walk through these to confirm everything works:

1. Visit `/` → you should be redirected to `/login`. Sign in.
2. **Plans** → confirm 3 seeded plans (Monthly, Quarterly, Yearly). Edit one, add one, delete one.
3. **Members → New Member** → create one with phone `+919999999999`.
4. From the member detail, **New Subscription** → pick Monthly → Mark as Paid. You're redirected back with a green banner showing **Download PDF** and **Send via WhatsApp** buttons.
5. **Download PDF** → opens a clean A4 receipt with your gym name, member, plan, dates, and amount in INR.
6. **Send via WhatsApp** → opens `wa.me/919999999999?text=...` in a new tab. Click Send inside WhatsApp manually.
7. **Dashboard** → the member appears in the **Active (Green)** column. MRR shows ₹1,500.
8. Open Prisma Studio (`npm run db:studio`) and edit the subscription's `endDate` to *today + 3 days* → the dashboard moves the member to **Yellow**.
9. Set `endDate` to *yesterday* → moves to **Red**.
10. **Check-in** → search by name → you see a giant **DENIED** card (because Red). The action is logged in the member's check-in history.
11. Set `endDate` back to a future date → check-in shows **ALLOWED**.
12. **Test the cron locally:**
    ```bash
    curl -X POST -H "Authorization: Bearer $CRON_SECRET" \
      http://localhost:3000/api/cron/expire-subscriptions
    ```
    Any expired-but-still-Active subscriptions flip to `status="Expired"`.
13. Sign out → confirm `/` redirects you back to `/login`.

## Deploying to Vercel

1. Push this repo to GitHub.
2. Create a Vercel project pointing at the repo.
3. Switch SQLite for a hosted Postgres (Vercel Postgres, Neon, Supabase) — edit `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
4. Add all the env vars from `.env.example` to the Vercel project (use real secrets, not the placeholders).
5. Run `npx prisma migrate deploy` once after the first deploy, then run the seed via `npm run db:seed` against the production database.
6. Vercel Cron will pick up `vercel.json` automatically and POST `/api/cron/expire-subscriptions` once a day at 19:00 UTC (00:30 IST).

## Project layout

```
prisma/
  schema.prisma     # Member, Plan, Subscription, CheckIn, User
  seed.ts           # Seeds admin user + default plans

src/
  lib/
    db.ts           # Prisma singleton
    auth.ts         # NextAuth credentials provider
    status.ts       # computeStatus() — single source of traffic-light truth
    currency.ts     # paise <-> ₹ formatting
    whatsapp.ts     # buildWhatsAppReceiptLink()
    pdf.tsx         # @react-pdf/renderer receipt template
    config.ts       # gym branding from env
  middleware.ts     # auth guard
  app/
    login/          # Sign-in page
    (app)/          # Authenticated routes — share Sidebar layout
      page.tsx           # Dashboard
      members/           # List, new, [id]
      plans/             # Manage plans
      subscriptions/new  # Create subscription / mark payment
      checkin/           # Front-desk screen
    api/
      auth/[...nextauth]/route.ts
      members/route.ts
      members/[id]/route.ts
      plans/route.ts
      plans/[id]/route.ts
      subscriptions/route.ts
      checkin/route.ts
      receipt/[subscriptionId]/route.ts   # PDF download
      cron/expire-subscriptions/route.ts  # Vercel Cron target
  components/       # Sidebar, StatusBadge, StatsCards, forms, screens
```

## Money handling

All prices are stored as **integer paise** (`pricePaise`, `pricePaidPaise`). Use `formatINR()` / `parseINR()` from `src/lib/currency.ts` for display and input — never do arithmetic on a formatted string.

`Subscription.pricePaidPaise` is snapshotted at creation time so historical revenue stays correct even if you raise plan prices later.
