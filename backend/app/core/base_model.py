"""
PrimeX Services CRM — SQLAlchemy Declarative Base & Common Mixins.

All models inherit from Base.
TimestampMixin and UUIDMixin are composed in via multiple inheritance.
"""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    """Declarative base shared by all SQLAlchemy models."""

    pass


class UUIDMixin:
    """Primary key as UUID v4, auto-generated."""

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )


class TimestampMixin:
    """Automatic created_at / updated_at timestamps, managed by the database."""

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class SoftDeleteMixin:
    """Soft-delete support — `is_deleted` flag instead of hard DELETE."""

    is_deleted: Mapped[bool] = mapped_column(default=False, nullable=False)
