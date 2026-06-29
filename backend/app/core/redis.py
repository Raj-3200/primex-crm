"""
PrimeX Services CRM — Redis Connection Pool.

Optional: if REDIS_URL is empty, Redis is disabled and all
cache operations become no-ops (useful for local dev without Docker).
"""

from __future__ import annotations

from typing import Optional

import redis.asyncio as aioredis
from redis.asyncio import ConnectionPool, Redis

from app.core.config import settings

_redis_pool: Optional[ConnectionPool] = None


async def init_redis_pool() -> None:
    """Create the global Redis connection pool. Skipped if REDIS_URL is empty."""
    global _redis_pool
    if not settings.redis_url:
        return  # Redis disabled — running without cache
    _redis_pool = ConnectionPool.from_url(
        settings.redis_url,
        max_connections=20,
        decode_responses=True,
    )


async def close_redis_pool() -> None:
    """Drain and close the Redis connection pool."""
    global _redis_pool
    if _redis_pool:
        await _redis_pool.aclose()
        _redis_pool = None


async def get_redis() -> Optional[Redis]:  # type: ignore[type-arg]
    """
    FastAPI dependency that returns a Redis client, or None if Redis is disabled.
    Callers should handle None gracefully.
    """
    if _redis_pool is None:
        return None
    return aioredis.Redis(connection_pool=_redis_pool)
