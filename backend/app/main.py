"""
PrimeX Services CRM — FastAPI Application Factory.
Vercel-compatible: no Redis dependency, graceful lifespan.
"""

from __future__ import annotations

import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from sqlalchemy import text

from app.core.config import settings
from app.core.database import engine
from app.core.exceptions import (
    PrimeXException,
    http_exception_handler,
    primex_exception_handler,
    validation_exception_handler,
)
from app.core.logging import configure_logging, logger

# ── Rate Limiter ──────────────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address, default_limits=["60/minute"])

# Routers
from app.auth.router import router as auth_router
from app.activity.router import router as activity_router
from app.analytics.router import router as analytics_router
from app.customers.router import router as customers_router
from app.orders.router import router as orders_router
from app.dashboard.router import router as dashboard_router
from app.payments.router import router as payments_router
from app.expenses.router import router as expenses_router
from app.documents.router import router as documents_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: startup → yield → shutdown."""
    configure_logging()
    logger.info("PrimeX CRM starting up — environment=%s", settings.environment)

    # Warm up DB connection on startup
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        logger.info("Database connection verified")
    except Exception as exc:
        logger.warning("DB warm-up skipped — will reconnect on first request: %s", exc)

    yield

    # Shutdown — dispose engine
    await engine.dispose()
    logger.info("PrimeX CRM shut down cleanly")


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description="Production CRM for PrimeX Services — Solar & Tank Cleaning",
        docs_url="/api/docs",
        redoc_url="/api/redoc",
        openapi_url="/api/openapi.json",
        lifespan=lifespan,
    )

    # ── Rate Limiting ─────────────────────────────────────────────────────────
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)  # type: ignore

    # ── CORS — allow localhost + all Vercel deployments ───────────────────────
    allowed_origins = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        *[o.strip() for o in settings.cors_origins.split(",") if o.strip()],
    ]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_origin_regex=r"https://.*\.vercel\.app",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Exception Handlers ────────────────────────────────────────────────────
    app.add_exception_handler(PrimeXException, primex_exception_handler)  # type: ignore
    app.add_exception_handler(HTTPException, http_exception_handler)  # type: ignore
    app.add_exception_handler(RequestValidationError, validation_exception_handler)  # type: ignore

    # ── Routers ───────────────────────────────────────────────────────────────
    prefix = settings.api_prefix
    app.include_router(auth_router, prefix=prefix)
    app.include_router(activity_router, prefix=prefix)
    app.include_router(analytics_router, prefix=prefix)
    app.include_router(customers_router, prefix=prefix)
    app.include_router(orders_router, prefix=prefix)
    app.include_router(dashboard_router, prefix=prefix)
    app.include_router(payments_router, prefix=prefix + "/payments", tags=["Payments"])
    app.include_router(expenses_router, prefix=prefix + "/expenses", tags=["Expenses"])
    app.include_router(documents_router, prefix=prefix + "/documents", tags=["Documents"])

    # ── Health check ─────────────────────────────────────────────────────────
    @app.get("/health", tags=["System"])
    async def health() -> dict:
        return {"status": "ok", "version": settings.app_version, "service": "primex-backend"}

    @app.get("/", tags=["System"])
    async def root() -> dict:
        return {"message": "PrimeX Services CRM API", "docs": "/api/docs"}

    return app


app = create_app()
