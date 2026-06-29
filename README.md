# PrimeX Services CRM

A production-ready, enterprise-grade CRM built for **PrimeX Services** — specialists in Tank Cleaning, Solar Panel Cleaning, and Annual Maintenance Contracts (AMC).

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" />
  <img src="https://img.shields.io/badge/PostgreSQL-Neon-green?logo=postgresql" />
  <img src="https://img.shields.io/badge/TypeScript-5-blue?logo=typescript" />
  <img src="https://img.shields.io/badge/Deployed-Vercel-black?logo=vercel" />
</p>

---

## Features

### Business Modules
- **Dashboard** — Real-time KPIs: daily revenue, monthly revenue, upcoming jobs, customer stats
- **Solar Cleaning** — Track solar panel cleaning jobs with panel count, capacity, roof type
- **Tank Cleaning** — Tank cleaning jobs with capacity, chemical usage, number of tanks
- **AMC (Combined)** — Annual maintenance contracts with renewal date tracking
- **Customers** — Full CRM: create, view, edit, order history per customer
- **Orders** — Complete order lifecycle: PENDING → SCHEDULED → IN_PROGRESS → COMPLETED
- **Employees** — Staff management with role-based access (Admin, Manager, Technician)
- **Invoices** — Auto-generated invoices from orders
- **Payments** — Track completed order payments
- **Quotations** — Pending/Scheduled orders as quotation pipeline
- **Contracts** — AMC contracts with expiry tracking
- **Calendar** — Monthly view of scheduled jobs
- **Reports** — Revenue charts, service mix, top customers, status breakdown
- **Expenses** — Revenue vs cost analytics
- **Notifications** — Real-time alerts: AMC renewals, payment due, order updates
- **Settings** — Company info, security, appearance, notifications

### Technical Highlights
- **100% serverless** — Next.js API routes connect directly to Neon PostgreSQL (no FastAPI required)
- **JWT authentication** — bcryptjs password hashing, 24h access tokens, 7d refresh tokens
- **Zero 404s** — All 22 pages fully implemented with real data
- **Production build** — 42 routes, 0 TypeScript errors, optimized bundle
- **Security headers** — X-Frame-Options, Content-Security-Policy, Referrer-Policy
- **Premium UI** — Warm amber theme, Recharts analytics, Framer Motion animations

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5 |
| Database | Neon (Serverless PostgreSQL) |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| UI | shadcn/ui + Tailwind CSS |
| Charts | Recharts |
| Animations | Framer Motion |
| State | Zustand + TanStack Query |
| Forms | React Hook Form + Zod |
| Deployment | Vercel |

---

## Quick Start

### Prerequisites
- Node.js 18+
- A [Neon](https://neon.tech) database account

### 1. Clone the repo
```bash
git clone https://github.com/Raj-3200/primex-crm.git
cd primex-crm/frontend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment
```bash
cp .env.example .env.local
# Edit .env.local and fill in your DATABASE_URL and JWT_SECRET
```

### 4. Seed the database (first time only)
```bash
node seed.js
```

### 5. Run development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Default login
```
Email:    admin@primex.com
Password: Admin@123
```

---

## Deploy to Vercel

### One-click deploy
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Raj-3200/primex-crm)

### Manual deploy
1. Import repo in [vercel.com/new](https://vercel.com/new)
2. Set root directory to `frontend`
3. Add environment variables:
   - `DATABASE_URL` — Your Neon connection string
   - `JWT_SECRET` — A random 32+ character secret key
4. Click **Deploy**

---

## Environment Variables

| Variable | Description | Required |
|---|---|---|
| `DATABASE_URL` | Neon PostgreSQL connection string | ✅ |
| `JWT_SECRET` | JWT signing secret (32+ chars) | ✅ |
| `NEXT_PUBLIC_APP_URL` | Your deployment URL | Optional |

---

## Project Structure

```
primex-crm/
└── frontend/                  # Next.js App
    ├── src/
    │   ├── app/
    │   │   ├── (auth)/        # Login page
    │   │   ├── (dashboard)/   # All CRM pages (22 pages)
    │   │   └── api/           # API routes (15+ endpoints)
    │   ├── components/        # Shared UI components
    │   ├── features/          # Feature-specific logic
    │   ├── stores/            # Zustand state (auth)
    │   └── lib/               # Utilities
    ├── seed.js                # Database seeder (local)
    ├── vercel.json            # Vercel config
    └── next.config.ts         # Next.js config
```

---

## Staff Accounts

| Name | Email | Password | Role |
|---|---|---|---|
| PrimeX Admin | admin@primex.com | Admin@123 | ADMIN |
| Vikram Singh | manager@primex.com | Manager@123 | MANAGER |
| Ravi Kumar | tech1@primex.com | Tech@123456 | TECHNICIAN |
| Suresh Nair | tech2@primex.com | Tech@123456 | TECHNICIAN |

---

## License

Private — PrimeX Services © 2024
