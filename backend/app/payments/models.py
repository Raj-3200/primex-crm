"""
PrimeX Services CRM — Payment Model.
"""

from __future__ import annotations

import enum

from sqlalchemy import DECIMAL, DateTime, Enum, ForeignKey, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.base_model import Base, SoftDeleteMixin, TimestampMixin, UUIDMixin


class PaymentMethod(str, enum.Enum):
    CASH = "CASH"
    UPI = "UPI"
    BANK = "BANK"
    CHEQUE = "CHEQUE"


class Payment(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    """
    Payment record linked to a service order.
    Supports partial payments — multiple Payment rows per order.
    """

    __tablename__ = "payments"

    order_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("orders.id"), nullable=False, index=True
    )
    amount: Mapped[float] = mapped_column(DECIMAL(12, 2), nullable=False)
    method: Mapped[PaymentMethod] = mapped_column(
        Enum(PaymentMethod, name="paymentmethod"), nullable=False
    )
    reference_number: Mapped[str | None] = mapped_column(Text)
    notes: Mapped[str | None] = mapped_column(Text)

    # When the physical payment was received (may differ from record creation time)
    paid_at: Mapped[object] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # FK — who recorded this payment
    recorded_by: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("users.id"), nullable=False
    )

    # Relationships
    order: Mapped[object] = relationship("Order", back_populates="payments")
    recorded_by_user: Mapped[object] = relationship(
        "User", foreign_keys=[recorded_by], back_populates="recorded_payments"
    )

    def __repr__(self) -> str:
        return f"<Payment {self.id} — ₹{self.amount} [{self.method}]>"
