"""
PrimeX Services CRM — FastAPI Application Factory.

Registers all routers, exception handlers, middleware, and lifespan events.
"""

from __future__ import annotations

import asyncio
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text

from app.core.config import settings
from app.core.database import engine
from app.core.exceptions import (
    PrimeXException,
    http_exception_handler,
    primex_exception_handler,
    validation_exception_handler,
)
from app.core.redis import close_redis_pool, init_redis_pool

# Routers
from app.auth.router import router as auth_router
from app.activity.router import router as activity_router
from app.customers.router import router as customers_router
from app.orders.router import router as orders_router
from app.dashboard.router import router as dashboard_router
from app.uploads.router import router as uploads_router


async def _neon_keep_alive() -> None:
    """Ping Neon DB every 4 minutes to prevent compute cold starts."""
    while True:
        await asyncio.sleep(240)
        try:
            async with engine.connect() as conn:
                await conn.execute(text("SELECT 1"))
        except Exception:
            pass  # Silently ignore — will reconnect on next real request


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: startup → yield → shutdown."""
    # Startup
    await init_redis_pool()
    Path(settings.upload_dir).mkdir(parents=True, exist_ok=True)

    # Warm up DB connection immediately on start (defeats Neon cold start)
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
    except Exception:
        pass

    # Keep DB warm in background
    keep_alive_task = asyncio.create_task(_neon_keep_alive())

    yield

    # Shutdown
    keep_alive_task.cancel()
    await close_redis_pool()


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description="Production CRM for PrimeX Services — Solar & Tank Cleaning",
        docs_url="/api/docs" if settings.debug else None,
        redoc_url="/api/redoc" if settings.debug else None,
        openapi_url="/api/openapi.json" if settings.debug else None,
        lifespan=lifespan,
    )

    # ── CORS ──────────────────────────────────────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:3001",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Exception Handlers ────────────────────────────────────────────────────
    app.add_exception_handler(PrimeXException, primex_exception_handler)  # type: ignore[arg-type]
    app.add_exception_handler(HTTPException, http_exception_handler)  # type: ignore[arg-type]
    app.add_exception_handler(RequestValidationError, validation_exception_handler)  # type: ignore[arg-type]

    # ── Routers ───────────────────────────────────────────────────────────────
    prefix = settings.api_prefix
    app.include_router(auth_router, prefix=prefix)
    app.include_router(activity_router, prefix=prefix)
    app.include_router(customers_router, prefix=prefix)
    app.include_router(orders_router, prefix=prefix)
    app.include_router(dashboard_router, prefix=prefix)
    app.include_router(uploads_router, prefix=prefix)

    # ── Static uploads ────────────────────────────────────────────────────────
    uploads_path = Path(settings.upload_dir)
    uploads_path.mkdir(parents=True, exist_ok=True)
    app.mount("/uploads", StaticFiles(directory=str(uploads_path)), name="uploads")

    # ── Health check ─────────────────────────────────────────────────────────
    @app.get("/health", tags=["System"])
    async def health() -> dict:
        return {"status": "ok", "version": settings.app_version}

    return app


app = create_app()
