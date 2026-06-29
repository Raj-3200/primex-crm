"""
PrimeX Services CRM — Async Database Engine & Session Factory.

Supports both PostgreSQL (asyncpg) and SQLite (aiosqlite) automatically.
`expire_on_commit=False` prevents DetachedInstanceError in async context.
"""

from __future__ import annotations

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.config import settings

# ── Engine ─────────────────────────────────────────────────────────────────────
_is_sqlite = settings.database_url.startswith("sqlite")

_engine_kwargs: dict = {
    "echo": settings.debug,
}

if not _is_sqlite:
    # PostgreSQL-specific pool settings
    _engine_kwargs.update(
        pool_size=20,
        max_overflow=10,
        pool_pre_ping=True,
        pool_recycle=300,
    )
else:
    # SQLite requires check_same_thread=False for async
    _engine_kwargs["connect_args"] = {"check_same_thread": False}

engine = create_async_engine(settings.database_url, **_engine_kwargs)

# Alias for backwards compat with seed script
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

# ── Session Factory ────────────────────────────────────────────────────────────
async_session_factory = AsyncSessionLocal


# ── Dependency ─────────────────────────────────────────────────────────────────
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency that yields a database session.
    Commits on success, rolls back on exception, always closes.
    """
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
