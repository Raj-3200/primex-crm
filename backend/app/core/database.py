"""
PrimeX Services CRM — Async Database Engine & Session Factory.
Vercel-compatible: uses NullPool for serverless environments.
"""

from __future__ import annotations

import os
from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.pool import NullPool

from app.core.config import settings

# ── Detect serverless environment ─────────────────────────────────────────────
IS_VERCEL = os.getenv("VERCEL") == "1"
_is_sqlite = settings.database_url.startswith("sqlite")

# Convert postgresql:// → postgresql+asyncpg:// if needed
_db_url = settings.database_url
if _db_url.startswith("postgresql://"):
    _db_url = _db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
elif _db_url.startswith("postgres://"):
    _db_url = _db_url.replace("postgres://", "postgresql+asyncpg://", 1)

# ── Engine ─────────────────────────────────────────────────────────────────────
if IS_VERCEL or _is_sqlite:
    # Serverless: NullPool — no persistent connections across invocations
    engine = create_async_engine(
        _db_url,
        echo=settings.debug,
        poolclass=NullPool,
    )
else:
    # Long-running server: use connection pool
    engine = create_async_engine(
        _db_url,
        echo=settings.debug,
        pool_size=5,
        max_overflow=5,
        pool_pre_ping=True,
        pool_recycle=300,
    )

# ── Session Factory ────────────────────────────────────────────────────────────
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

async_session_factory = AsyncSessionLocal


# ── Dependency ─────────────────────────────────────────────────────────────────
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency — yields a DB session, commits on success."""
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
