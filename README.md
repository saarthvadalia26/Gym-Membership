# 🏋️‍♂️ Gym Connect

[![Next.js](https://img.shields.io/badge/Next.js-15-000000?style=for-the-badge&logo=nextdotjs)](https://nextjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Auth.js](https://img.shields.io/badge/Auth.js-v5-FF4154?style=for-the-badge&logo=nextdotjs)](https://authjs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)

![Gym Connect Banner](./assets/banner.png)

## 🌟 Overview

**Gym Connect** is a high-performance, full-stack membership management system designed to replace messy spreadsheets with a streamlined, real-time dashboard. Built with **Next.js 15** and **Auth.js v5**, it provides gym owners with a professional toolset for tracking subscriptions, managing members, and processing payments with ease.

---

## 🚀 Key Features

### 📊 Intelligent Dashboard
- **Traffic-Light Status**: Instant visual feedback—Green (Active), Yellow (Expiring), and Red (Expired).
- **Revenue Analytics**: Real-time MRR (Monthly Recurring Revenue) tracking and 30-day collection forecasts.
- **Engagement Stats**: Monitor daily check-ins and member growth trends.

### 👥 Member Management
- **Smart Profiles**: Comprehensive history of subscriptions, payments, and attendance.
- **QR Code Check-ins**: Generate unique QR codes for every member for instant front-desk verification.
- **Referral System**: Track and reward your top referrers directly from the dashboard.

### 🛡️ Front-Desk Operations
- **Instant Verification**: A dedicated check-in screen with a powerful search and QR scanner.
- **Automated Logs**: Every check-in is timestamped and logged for security and attendance tracking.
- **Birthday Alerts**: Never miss a member's special day with integrated birthday notifications.

### 📄 Financial Tools
- **One-Click Receipts**: Generate professional PDF receipts instantly upon payment.
- **WhatsApp Integration**: Send pre-filled receipt links directly to members via WhatsApp.
- **Automated Expiry**: Nightly cron jobs automatically update subscription statuses, keeping your reports accurate.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: Prisma ORM with PostgreSQL (Production) / SQLite (Local)
- **Authentication**: Auth.js v5 (Beta)
- **Styling**: Tailwind CSS + Shadcn UI
- **Reports**: @react-pdf/renderer for PDF generation
- **Messaging**: WhatsApp API (wa.me) integration

---

## 📸 Preview

<p align="center">
  <img src="./assets/mobile_mockup.png" width="400" alt="Mobile Check-in Preview" />
</p>

---

## ⚙️ Getting Started

### 1. Installation

```bash
# Clone the repository
git clone https://github.com/saarthvadalia26/Gym-Membership.git

# Install dependencies
npm install
```

### 2. Environment Setup

Create a `.env` file in the root directory and configure the following:

```env
# Database
DATABASE_URL="your-postgresql-url"

# Auth.js (Generate with 'npx auth secret')
AUTH_SECRET="your-secret"
AUTH_TRUST_HOST="true"

# Admin Credentials
ADMIN_EMAIL="admin@yourgym.com"
ADMIN_PASSWORD="securepassword"

# Gym Branding
GYM_NAME="Your Gym Name"
GYM_ADDRESS="123 Fitness St."
GYM_PHONE="+91 99999 99999"

# Optional: Resend API for emails
RESEND_API_KEY="re_..."
```

### 3. Database Initialization

```bash
# Run migrations
npx prisma migrate dev --name init

# Seed initial data (Admin user & Plans)
npm run db:seed
```

### 4. Run Development Server

```bash
npm run dev -p 3456
```
Visit `http://localhost:3456` and sign in with your admin credentials.

---

## 🌐 Deployment (Vercel)

1. **Database**: Use a hosted PostgreSQL provider (Vercel Postgres, Neon, or Supabase).
2. **Environment Variables**: Add all `.env` variables to your Vercel project settings.
3. **Cron Jobs**: The project includes a `vercel.json` for automated subscription expiration checks (triggers daily at 19:00 UTC).

---

## 💰 Money Handling

All financial data is stored as **integer paise** to avoid floating-point errors.
- `pricePaise`: Standard plan price.
- `pricePaidPaise`: Actual amount paid (snapshotted at time of purchase).
- **Currency**: Formatted to INR (₹) using `Intl.NumberFormat`.

---

## 👨‍💻 Author

**Saarth Vadalia**
- GitHub: [@saarthvadalia26](https://github.com/saarthvadalia26)
- Project Link: [Gym Membership](https://github.com/saarthvadalia26/Gym-Membership)
