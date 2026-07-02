"""
PrimeX Services CRM — Structured Logging Configuration.

Call configure_logging() once at application startup (inside create_app or lifespan).
Use `logger` (or per-module loggers via logging.getLogger('primex.<module>')) everywhere.
"""

from __future__ import annotations

import logging
import sys

from app.core.config import settings


def configure_logging() -> None:
    """
    Configure root and primex logger.

    - DEBUG level in dev/debug mode; INFO in production.
    - Single StreamHandler → stdout so container log collectors (Docker, Render, Vercel)
      can capture all output from fd 1.
    - Format includes timestamp, level, logger name, and message.
    """
    log_level = logging.DEBUG if settings.debug else logging.INFO

    # Root logger — keeps third-party libs at WARNING to avoid noise
    logging.basicConfig(
        level=logging.WARNING,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        datefmt="%Y-%m-%dT%H:%M:%S",
        handlers=[logging.StreamHandler(sys.stdout)],
        force=True,
    )

    # PrimeX application logger — verbose level
    primex_logger = logging.getLogger("primex")
    primex_logger.setLevel(log_level)
    if not primex_logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(
            logging.Formatter(
                fmt="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
                datefmt="%Y-%m-%dT%H:%M:%S",
            )
        )
        primex_logger.addHandler(handler)
    primex_logger.propagate = False  # avoid duplicate output via root

    # Silence noisy SQLAlchemy echo unless in debug
    if not settings.debug:
        logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    else:
        logging.getLogger("sqlalchemy.engine").setLevel(logging.INFO)

    primex_logger.info(
        "Logging configured — level=%s environment=%s",
        logging.getLevelName(log_level),
        settings.environment,
    )


# Module-level convenience logger for top-level imports
logger = logging.getLogger("primex")
