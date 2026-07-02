# PrimeX CRM — Backend API

FastAPI backend for PrimeX Services CRM.

## Tech Stack
- **FastAPI** + Python 3.12
- **Neon PostgreSQL** (asyncpg)
- **SQLAlchemy** (async) + Alembic migrations
- **JWT** authentication (PyJWT + passlib)

## Deploy to Vercel

### Environment Variables (Required)
| Variable | Value |
|---|---|
| `DATABASE_URL` | `postgresql+asyncpg://...` (Neon connection string) |
| `SECRET_KEY` | A random 32+ character secret key |
| `ENVIRONMENT` | `production` |
| `CORS_ORIGINS` | Your frontend Vercel URL (e.g. `https://primex-frontend.vercel.app`) |

### Quick Deploy
1. Import this repo on [vercel.com/new](https://vercel.com/new)
2. Add the environment variables above
3. Click Deploy ✅

## API Endpoints

```
POST /api/v1/auth/login
GET  /api/v1/auth/me
POST /api/v1/auth/refresh
GET  /api/v1/customers
POST /api/v1/customers
GET  /api/v1/orders
POST /api/v1/orders
GET  /api/v1/dashboard/stats
GET  /health
```

## Local Development

```bash
python -m venv .venv
.venv/Scripts/activate  # Windows
pip install -r requirements.txt
cp .env.example .env
# Fill in DATABASE_URL and SECRET_KEY
uvicorn app.main:app --reload
```

API docs at [http://localhost:8000/api/docs](http://localhost:8000/api/docs)
