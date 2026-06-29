"""
PrimeX Services CRM — Order, Solar Cleaning, Tank Cleaning Models.
"""

from __future__ import annotations

import enum
from datetime import date, datetime, time

from sqlalchemy import (
    DATE,
    JSON,
    DECIMAL,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
    Time,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.base_model import Base, SoftDeleteMixin, TimestampMixin, UUIDMixin


class ServiceType(str, enum.Enum):
    SOLAR = "SOLAR"
    TANK = "TANK"
    COMBINED = "COMBINED"


class OrderStatus(str, enum.Enum):
    PENDING = "PENDING"
    SCHEDULED = "SCHEDULED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class RoofType(str, enum.Enum):
    FLAT = "FLAT"
    SLOPED = "SLOPED"
    GROUND_MOUNTED = "GROUND_MOUNTED"


class PanelType(str, enum.Enum):
    MONOCRYSTALLINE = "MONOCRYSTALLINE"
    POLYCRYSTALLINE = "POLYCRYSTALLINE"
    THIN_FILM = "THIN_FILM"


class TankType(str, enum.Enum):
    OVERHEAD = "OVERHEAD"
    UNDERGROUND = "UNDERGROUND"
    SUMP = "SUMP"


class Order(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    """
    Service order — the primary transactional entity.
    Can represent solar cleaning, tank cleaning, or both (COMBINED).
    """

    __tablename__ = "orders"

    order_number: Mapped[str] = mapped_column(
        String(30), unique=True, nullable=False, index=True
    )
    customer_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("customers.id"), nullable=False, index=True
    )
    service_type: Mapped[ServiceType] = mapped_column(
        Enum(ServiceType, name="servicetype"), nullable=False
    )
    status: Mapped[OrderStatus] = mapped_column(
        Enum(OrderStatus, name="orderstatus"),
        default=OrderStatus.PENDING,
        nullable=False,
        index=True,
    )
    scheduled_date: Mapped[date | None] = mapped_column(DATE)
    scheduled_time: Mapped[time | None] = mapped_column(Time)
    completed_at: Mapped[datetime | None] = mapped_column()

    # Pricing
    subtotal: Mapped[float] = mapped_column(DECIMAL(12, 2), default=0)
    discount: Mapped[float] = mapped_column(DECIMAL(12, 2), default=0)
    tax_rate: Mapped[float] = mapped_column(DECIMAL(5, 2), default=0)
    tax_amount: Mapped[float] = mapped_column(DECIMAL(12, 2), default=0)
    total_amount: Mapped[float] = mapped_column(DECIMAL(12, 2), default=0)

    notes: Mapped[str | None] = mapped_column(Text)

    # FKs
    assigned_to: Mapped[str | None] = mapped_column(
        UUID(as_uuid=False), ForeignKey("users.id")
    )
    created_by: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("users.id"), nullable=False
    )

    # Relationships
    customer: Mapped[object] = relationship("Customer", back_populates="orders")
    assigned_user: Mapped[object | None] = relationship(
        "User", back_populates="assigned_orders", foreign_keys=[assigned_to]
    )
    created_by_user: Mapped[object] = relationship(
        "User", back_populates="created_orders", foreign_keys=[created_by]
    )
    solar_detail: Mapped[object | None] = relationship(
        "SolarCleaningDetail",
        back_populates="order",
        cascade="all, delete-orphan",
        uselist=False,
    )
    tank_detail: Mapped[object | None] = relationship(
        "TankCleaningDetail",
        back_populates="order",
        cascade="all, delete-orphan",
        uselist=False,
    )
    activity_logs: Mapped[list] = relationship("ActivityLog", back_populates="order")

    def __repr__(self) -> str:
        return f"<Order {self.order_number} [{self.status}]>"


class SolarCleaningDetail(Base, UUIDMixin, TimestampMixin):
    """Detailed capture for solar panel cleaning jobs."""

    __tablename__ = "solar_cleaning_details"

    order_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("orders.id"), nullable=False, unique=True
    )
    panel_count: Mapped[int] = mapped_column(Integer, nullable=False)
    capacity_kw: Mapped[float] = mapped_column(DECIMAL(8, 2), nullable=False)
    roof_type: Mapped[RoofType] = mapped_column(
        Enum(RoofType, name="rooftype"), nullable=False
    )
    panel_type: Mapped[PanelType] = mapped_column(
        Enum(PanelType, name="paneltype"), nullable=False
    )
    before_photos: Mapped[list] = mapped_column(JSON, default=list)
    after_photos: Mapped[list] = mapped_column(JSON, default=list)
    remarks: Mapped[str | None] = mapped_column(Text)

    order: Mapped[Order] = relationship("Order", back_populates="solar_detail")


class TankCleaningDetail(Base, UUIDMixin, TimestampMixin):
    """Detailed capture for water tank cleaning jobs."""

    __tablename__ = "tank_cleaning_details"

    order_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("orders.id"), nullable=False, unique=True
    )
    tank_type: Mapped[TankType] = mapped_column(
        Enum(TankType, name="tanktype"), nullable=False
    )
    capacity_liters: Mapped[int] = mapped_column(Integer, nullable=False)
    number_of_tanks: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    before_photos: Mapped[list] = mapped_column(JSON, default=list)
    after_photos: Mapped[list] = mapped_column(JSON, default=list)
    chemical_used: Mapped[str | None] = mapped_column(String(255))
    remarks: Mapped[str | None] = mapped_column(Text)

    order: Mapped[Order] = relationship("Order", back_populates="tank_detail")
