# Deploying to Vercel — step by step

This guide takes you from a local project to a live URL anyone can visit.
Estimated time: **15–25 minutes** if you're new to all of this.

You will create three free accounts:
1. **GitHub** — to host your code
2. **Vercel** — to host the website
3. A **Postgres database provider** — pick one in Part 2:
   - **Supabase** (recommended if you might want auth/storage features later)
   - **Neon** (recommended if you only need a database, simpler setup)

> 💡 Everything in this guide is free. You won't be asked for a credit card.

---

## Part 1 — Push your code to GitHub

### 1. Create a GitHub account (skip if you have one)
Go to <https://github.com/signup> and finish signup.

### 2. Create a new empty repository
- Click the **+** in the top-right of github.com → **New repository**
- Repository name: `gym-membership` (or anything you like)
- Set it to **Private** (recommended — your code is yours)
- **Do NOT** check "Add a README", "Add .gitignore", or "Add a license"
  (we already have those)
- Click **Create repository**

### 3. Push the code from your computer

GitHub will show you a page with commands. **Use the second section** ("…or push an existing repository from the command line"). It looks like:

```bash
git remote add origin https://github.com/YOUR_USERNAME/gym-membership.git
git branch -M main
git push -u origin main
```

Run those commands in your terminal **inside this project folder**:

```bash
cd "d:/Saarth/Saarth/Gym Membership"
git remote add origin https://github.com/YOUR_USERNAME/gym-membership.git
git push -u origin main
```

The first push will ask you to sign in to GitHub. A browser window will open
— sign in and authorize, then come back to the terminal.

When it finishes, refresh the GitHub page and you should see all your files.

---

## Part 2 — Create a free Postgres database

Vercel itself doesn't store your data — it just runs the website. You need a
separate Postgres database. Pick **one** of the two options below.

### Option A — Supabase (recommended)

Supabase gives you 500 MB of Postgres on the free tier, plus a nice visual
table editor at supabase.com. Same engine as Neon under the hood.

#### 1. Sign up at <https://supabase.com>
Click **Start your project** → sign in with GitHub.

#### 2. Create a project
- Click **New Project**
- Organization: leave default
- Name: `gym-membership`
- Database password: **click "Generate a password"** and **save it somewhere safe** —
  you'll need it in the next step (Supabase doesn't show it again later)
- Region: pick the one closest to your users (e.g. `Asia South (Mumbai)` for India)
- Pricing plan: **Free**
- Click **Create new project** — provisioning takes 1–2 minutes

#### 3. Copy the connection string
- Once the project is ready, click **Connect** at the top of the page
  (or go to **Project Settings** → **Database** → **Connection string**)
- Find the **"Connection pooling"** section (NOT "Direct connection")
- Select mode: **Transaction**
- Copy the URI — it looks like:
  ```
  postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
  ```
- **Replace `[YOUR-PASSWORD]`** with the password you saved in step 2
- **Add `?pgbouncer=true&connection_limit=1`** to the end so it becomes:
  ```
  postgresql://postgres.xxxxx:YOUR-REAL-PASSWORD@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
  ```

> ⚠️ **Why "Connection pooling" / port 6543, not direct / port 5432?**
> Vercel functions are serverless — every request can spin up a fresh server.
> The direct connection would exhaust Postgres's connection limit fast.
> The **transaction-mode pooler on port 6543** is built for serverless and
> the `pgbouncer=true` flag tells Prisma to behave well with it.

Save this final string somewhere — you'll paste it into Vercel in a moment.

---

### Option B — Neon

Neon is built specifically for serverless apps. Smaller learning curve than Supabase.

#### 1. Sign up at <https://neon.tech>
You can sign up with your GitHub account — fastest option.

#### 2. Create a project
- After signing in, you'll be on the dashboard
- Click **New Project**
- Project name: `gym-membership`
- Postgres version: leave the default (latest)
- Region: pick the one closest to your users (e.g. **AWS Asia Pacific (Mumbai)** for India)
- Click **Create Project**

#### 3. Copy the connection string
- After creation, you'll see a "Connection string" box
- Click the eye icon to reveal the password
- **Copy the entire string** — it looks like:
  ```
  postgresql://username:password@ep-something.aws.neon.tech/neondb?sslmode=require
  ```
- Save this somewhere safe — you'll paste it into Vercel in a moment.

---

## Part 3 — Deploy on Vercel

### 1. Sign up at <https://vercel.com/signup>
**Choose "Continue with GitHub"** — this lets Vercel see your repos.

### 2. Import your repository
- After signing in you'll land on the dashboard
- Click **Add New…** → **Project**
- Find `gym-membership` in the list and click **Import**
  (if you don't see it, click "Adjust GitHub App Permissions" and grant access to the repo)

### 3. Configure the project
Vercel auto-detects Next.js. Don't change the build settings.

**Before clicking Deploy**, expand the **Environment Variables** section and add these one by one:

| Name | Value |
|---|---|
| `DATABASE_URL` | The Postgres connection string you copied in Part 2 (Supabase pooler URL or Neon URL) |
| `NEXTAUTH_SECRET` | A long random string — see below for how to generate |
| `AUTH_SECRET` | **Same value as `NEXTAUTH_SECRET`** |
| `AUTH_TRUST_HOST` | `true` |
| `CRON_SECRET` | A different long random string |

To generate the random secrets, run this **once for each one** in your terminal:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

It will print something like `xK2j7+vBd9...=` — copy and paste it into the Vercel form.

> ⚠️ Skip `NEXTAUTH_URL` for now — we'll add it after the first deploy
> when we know the actual URL.

### 4. Click **Deploy**
This takes 1–3 minutes. Watch the build log scroll by. When you see the
fireworks 🎉, it's deployed.

### 5. Run database migrations against the new Postgres
The deployment created the website, but the database is still empty (no tables).
You need to apply the migrations once.

> ⚠️ **If you're using Supabase**, do NOT use the pooler URL (port 6543) for
> migrations — Prisma Migrate doesn't work over pgBouncer. Get the **Direct
> connection** URL instead: in Supabase, **Project Settings → Database →
> Connection string → Direct connection (port 5432)**. Use that URL only for
> this one command, then keep using the pooler URL in Vercel.

**From your local terminal:**

```bash
# Use the direct connection URL here (port 5432 for Supabase, normal Neon URL for Neon)
DATABASE_URL="paste-direct-connection-string-here" npx prisma migrate deploy
```

(On Windows PowerShell, use:
`$env:DATABASE_URL="..."; npx prisma migrate deploy`)

You'll see something like:
```
2 migrations found in prisma/migrations
Applying migration `20260407132452_init`
Applying migration `20260408_multitenant`
All migrations have been successfully applied.
```

### 6. Add `NEXTAUTH_URL` and redeploy
- In Vercel, click your project → **Settings** → **Environment Variables**
- Add a new variable:
  - Name: `NEXTAUTH_URL`
  - Value: your project's production URL (something like `https://gym-membership-abc123.vercel.app`)
- Save
- Go to the **Deployments** tab → click the **…** menu on the latest deployment → **Redeploy**

### 7. Visit your live URL
Click the URL at the top of your Vercel project page. You'll land on the **Login** page.

Click **"Create your gym account"** → fill in the form → you're in. 🎉

---

## Optional: Custom domain

1. Buy a domain (Namecheap, Cloudflare, GoDaddy)
2. In Vercel → Project → **Settings** → **Domains**
3. Add your domain — Vercel shows you the DNS records to set up
4. After DNS propagates (a few minutes to a few hours), update `NEXTAUTH_URL`
   in Environment Variables to your new domain and redeploy

---

## Updating your live website

Whenever you change the code:

```bash
git add .
git commit -m "describe your change"
git push
```

Vercel automatically detects the push and redeploys in ~1 minute. No extra steps.

---

## Common problems

**"Internal Server Error" on the live site**
→ Almost always a missing or wrong environment variable.
   Check Vercel → Settings → Environment Variables. Make sure `DATABASE_URL`,
   `NEXTAUTH_SECRET`, `AUTH_SECRET`, and `AUTH_TRUST_HOST` are all set.

**"P1001: Can't reach database server"**
→ Your `DATABASE_URL` is wrong, or it's missing `?sslmode=require` at the end.

**Login works but the dashboard says "redirect loop"**
→ `NEXTAUTH_URL` is wrong. It must exactly match your live URL
   (including `https://` and no trailing slash).

**Pre-existing local SQLite data is gone**
→ That's normal — production uses a fresh Postgres database. Your old
   data is still on your computer at `prisma/dev.db.backup-before-postgres`.

**Want to use Postgres locally too?**
→ Just put the same Neon connection string in your local `.env` file's
   `DATABASE_URL` line, then run `npm run dev` as usual. You and your
   live site will share the same database.

---

## What lives where

| Thing | Where |
|---|---|
| Website code | GitHub |
| Website server | Vercel |
| Database | Neon |
| Login secrets | Vercel Environment Variables |
| Member data | Neon Postgres |
| PDF receipts | Generated on the fly by Vercel |
| Cron job (auto-expire) | Runs daily on Vercel via `vercel.json` |

You don't pay for any of this on the free tier. If you outgrow the free
tier (more than ~10,000 members or heavy traffic), Vercel and Neon both
have paid plans starting around $20/month.
