"""
PrimeX Services CRM — Activity Log & Notification Models.
"""

from __future__ import annotations

import enum
from typing import Any

from sqlalchemy import JSON, Enum, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.base_model import Base, TimestampMixin, UUIDMixin


class ActivityLog(Base, UUIDMixin, TimestampMixin):
    """
    Immutable audit trail of all meaningful actions in the system.
    Written by the audit middleware and service layer.
    """

    __tablename__ = "activity_logs"

    entity_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    entity_id: Mapped[str] = mapped_column(String(36), index=True)
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    details: Mapped[dict | None] = mapped_column(JSON)
    ip_address: Mapped[str | None] = mapped_column(String(45))

    # FKs
    user_id: Mapped[str | None] = mapped_column(
        UUID(as_uuid=False), ForeignKey("users.id")
    )
    customer_id: Mapped[str | None] = mapped_column(
        UUID(as_uuid=False), ForeignKey("customers.id")
    )
    order_id: Mapped[str | None] = mapped_column(
        UUID(as_uuid=False), ForeignKey("orders.id")
    )

    user: Mapped[object | None] = relationship("User", back_populates="activity_logs")
    customer: Mapped[object | None] = relationship(
        "Customer", back_populates="activity_logs"
    )
    order: Mapped[object | None] = relationship("Order", back_populates="activity_logs")


class NotificationType(str, enum.Enum):
    AMC_REMINDER = "AMC_REMINDER"
    PAYMENT_DUE = "PAYMENT_DUE"
    RENEWAL_DUE = "RENEWAL_DUE"
    ORDER_ASSIGNED = "ORDER_ASSIGNED"
    ORDER_STATUS = "ORDER_STATUS"
    SYSTEM = "SYSTEM"


class Notification(Base, UUIDMixin, TimestampMixin):
    """In-app notification for the admin / employees."""

    __tablename__ = "notifications"

    user_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("users.id"), nullable=False, index=True
    )
    type: Mapped[NotificationType] = mapped_column(
        Enum(NotificationType, name="notificationtype"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    is_read: Mapped[bool] = mapped_column(default=False, nullable=False)
    entity_type: Mapped[str | None] = mapped_column(String(50))
    entity_id: Mapped[str | None] = mapped_column(String(36))
    data: Mapped[dict | None] = mapped_column(JSON)
