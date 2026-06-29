"""
PrimeX Services CRM — Redis Connection Pool.

Initialised in the FastAPI lifespan, shared across all requests.
Uses hiredis C-parser for maximum throughput.
"""

from __future__ import annotations

import redis.asyncio as aioredis
from redis.asyncio import ConnectionPool, Redis

from app.core.config import settings

_redis_pool: ConnectionPool | None = None


async def init_redis_pool() -> None:
    """Create the global Redis connection pool. Call once at startup."""
    global _redis_pool
    _redis_pool = ConnectionPool.from_url(
        settings.redis_url,
        max_connections=20,
        decode_responses=True,
    )


async def close_redis_pool() -> None:
    """Drain and close the Redis connection pool. Call once at shutdown."""
    global _redis_pool
    if _redis_pool:
        await _redis_pool.aclose()
        _redis_pool = None


async def get_redis() -> Redis:  # type: ignore[type-arg]
    """FastAPI dependency that returns a Redis client backed by the shared pool."""
    if _redis_pool is None:
        raise RuntimeError("Redis pool is not initialised. Did lifespan run?")
    return aioredis.Redis(connection_pool=_redis_pool)
