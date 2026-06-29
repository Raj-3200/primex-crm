# PrimeX Services CRM

Enterprise CRM for PrimeX Services — Solar Panel Cleaning, Water Tank Cleaning, AMC Management.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 · TypeScript · Tailwind CSS · shadcn/ui · Framer Motion |
| State | TanStack Query · Zustand |
| Backend | FastAPI · SQLAlchemy 2.0 (async) · Alembic |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| Auth | JWT (PyJWT) · bcrypt |
| Container | Docker · Docker Compose |

---

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js ≥ 20
- Python ≥ 3.12

### 1. Clone & configure

```bash
cp .env.example .env
# Edit .env — change SECRET_KEY at minimum
```

### 2. Start with Docker (recommended)

```bash
docker-compose up --build
```

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/api/docs (dev mode only)

### 3. Run migrations

```bash
# Inside the backend container
docker-compose exec backend alembic upgrade head

# Or locally (with DB running)
cd backend
pip install -r requirements.txt
alembic upgrade head
```

### 4. Create the first admin user

```bash
# The first user must be created via the API directly
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@primex.com","password":"SecurePass123","full_name":"Admin","role":"ADMIN"}'
```

> ⚠️ After the first admin is created, all subsequent registrations require an admin JWT token.

---

## Local Development (without Docker)

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate       # Windows
pip install -r requirements.txt

# Set env vars
cp ../.env.example .env

# Run migrations
alembic upgrade head

# Start dev server
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
cp ../.env.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1

npm run dev
```

---

## Project Structure

```
primex/
├── backend/              # FastAPI application
│   ├── app/
│   │   ├── core/         # Config, DB, Redis, Security, Dependencies
│   │   ├── auth/         # Authentication module
│   │   ├── users/        # User management
│   │   ├── customers/    # Customer CRM module
│   │   ├── orders/       # Orders + Solar/Tank details
│   │   ├── dashboard/    # Aggregated stats
│   │   ├── activity/     # Audit trail
│   │   └── uploads/      # File management
│   └── alembic/          # Database migrations
│
├── frontend/             # Next.js application
│   └── src/
│       ├── app/          # App Router pages
│       ├── components/   # Shared UI components
│       ├── features/     # Domain feature modules
│       ├── lib/          # API client, utilities
│       ├── stores/       # Zustand state
│       └── providers/    # React context providers
│
├── docker-compose.yml    # Full stack orchestration
└── .env.example          # Environment template
```

---

## Phase Roadmap

| Phase | Status | Modules |
|-------|--------|---------|
| Phase 1 | ✅ **Built** | Auth, Dashboard, Customers, Orders, Solar/Tank |
| Phase 2 | 🔜 Planned | AMC Engine, Payments, Invoices, Quotations |
| Phase 3 | 🔜 Planned | Calendar, Employees, Contracts, Expenses |
| Phase 4 | 🔜 Planned | Reports, Analytics, Documents, Notifications, Settings |

---

## API Reference

All endpoints are prefixed with `/api/v1`.

| Module | Prefix |
|--------|--------|
| Auth | `/auth` |
| Customers | `/customers` |
| Orders | `/orders` |
| Dashboard | `/dashboard` |
| Uploads | `/uploads` |

Full interactive docs available at `/api/docs` when `DEBUG=true`.
