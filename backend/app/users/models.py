"""
PrimeX Services CRM — User & Role Models.
"""

from __future__ import annotations

import enum

from sqlalchemy import Boolean, Enum, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.base_model import Base, SoftDeleteMixin, TimestampMixin, UUIDMixin


class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    MANAGER = "MANAGER"
    TECHNICIAN = "TECHNICIAN"


class User(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    """
    Application user — can be Admin, Manager or Technician.
    Only Admin can register new users.
    """

    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(20))
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="userrole"), default=UserRole.TECHNICIAN, nullable=False
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    created_customers: Mapped[list] = relationship(
        "Customer", back_populates="created_by_user", foreign_keys="Customer.created_by"
    )
    created_orders: Mapped[list] = relationship(
        "Order", back_populates="created_by_user", foreign_keys="Order.created_by"
    )
    assigned_orders: Mapped[list] = relationship(
        "Order", back_populates="assigned_user", foreign_keys="Order.assigned_to"
    )
    refresh_tokens: Mapped[list] = relationship(
        "RefreshToken", back_populates="user", cascade="all, delete-orphan"
    )
    activity_logs: Mapped[list] = relationship(
        "ActivityLog", back_populates="user"
    )

    def __repr__(self) -> str:
        return f"<User {self.email} [{self.role}]>"
