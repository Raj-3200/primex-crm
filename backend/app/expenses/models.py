"""
PrimeX Services CRM — Expense Model.
"""

from __future__ import annotations

import enum
from datetime import date

from sqlalchemy import DATE, DECIMAL, Enum, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.base_model import Base, SoftDeleteMixin, TimestampMixin, UUIDMixin


class ExpenseCategory(str, enum.Enum):
    VEHICLE = "VEHICLE"
    EQUIPMENT = "EQUIPMENT"
    SUPPLIES = "SUPPLIES"
    STAFF = "STAFF"
    UTILITIES = "UTILITIES"
    OTHER = "OTHER"


class Expense(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    """
    Operational expense record for the business.
    Tracks outgoings by category for P&L tracking.
    """

    __tablename__ = "expenses"

    category: Mapped[ExpenseCategory] = mapped_column(
        Enum(ExpenseCategory, name="expensecategory"), nullable=False, index=True
    )
    description: Mapped[str] = mapped_column(Text, nullable=False)
    amount: Mapped[float] = mapped_column(DECIMAL(12, 2), nullable=False)
    expense_date: Mapped[date] = mapped_column(DATE, nullable=False, index=True)
    reference: Mapped[str | None] = mapped_column(String(255))

    # FK — who recorded this expense
    recorded_by: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("users.id"), nullable=False
    )

    # Relationships
    recorded_by_user: Mapped[object] = relationship(
        "User", foreign_keys=[recorded_by], back_populates="recorded_expenses"
    )

    def __repr__(self) -> str:
        return f"<Expense {self.id} — ₹{self.amount} [{self.category}]>"
