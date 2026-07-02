# PrimeX CRM — Frontend

Production-ready Next.js CRM for PrimeX Services (Solar Cleaning, Tank Cleaning, AMC).

## Tech Stack
- **Next.js 16** (App Router) + TypeScript
- **Neon PostgreSQL** (serverless, direct connection)
- **shadcn/ui** + Tailwind CSS + Framer Motion
- **Recharts** for analytics

## Features
- 22 pages, 15 API endpoints — all working with real Neon DB
- JWT authentication (bcryptjs)
- Dashboard, Customers, Orders, Solar, Tank, AMC, Calendar, Reports, Invoices, Payments, Quotations, Contracts, Expenses, Employees, Notifications, Settings

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Raj-3200/primex-frontend)

### Environment Variables (Required)
| Variable | Value |
|---|---|
| `DATABASE_URL` | Your Neon PostgreSQL connection string |
| `JWT_SECRET` | A random 32+ character secret key |

### Quick Deploy
1. Import this repo on [vercel.com/new](https://vercel.com/new)
2. Add the 2 environment variables above
3. Click Deploy ✅

## Local Development

```bash
npm install
cp .env.example .env.local
# Fill in DATABASE_URL and JWT_SECRET in .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

**Login:** `admin@primex.com` / `Admin@123`

## Project Structure

```
src/
├── app/
│   ├── (auth)/login/       # Login page
│   ├── (dashboard)/        # All 22 CRM pages
│   └── api/                # 15 serverless API routes
├── components/             # Shared UI components
├── features/               # Feature-specific logic
├── stores/                 # Zustand state (auth, sidebar)
└── lib/                    # Utilities
```
