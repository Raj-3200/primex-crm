"""
PrimeX Services CRM — Customer Model.
"""

from __future__ import annotations

import enum

from sqlalchemy import Enum, Float, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.base_model import Base, SoftDeleteMixin, TimestampMixin, UUIDMixin


class PropertyType(str, enum.Enum):
    RESIDENTIAL = "RESIDENTIAL"
    COMMERCIAL = "COMMERCIAL"
    INDUSTRIAL = "INDUSTRIAL"


class LeadSource(str, enum.Enum):
    REFERRAL = "REFERRAL"
    WEBSITE = "WEBSITE"
    SOCIAL_MEDIA = "SOCIAL_MEDIA"
    WALK_IN = "WALK_IN"
    COLD_CALL = "COLD_CALL"
    OTHER = "OTHER"


class Customer(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    """
    Customer record — the central entity of the CRM.
    All orders, AMC, invoices and payments link back to a customer.
    """

    __tablename__ = "customers"

    # Auto-generated customer ID (PX-C-0001 format)
    customer_id: Mapped[str] = mapped_column(
        String(20), unique=True, nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    phone: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    alternate_phone: Mapped[str | None] = mapped_column(String(20))
    email: Mapped[str | None] = mapped_column(String(255))
    address: Mapped[str] = mapped_column(Text, nullable=False)

    # Google Maps location
    latitude: Mapped[float | None] = mapped_column(Float)
    longitude: Mapped[float | None] = mapped_column(Float)
    maps_url: Mapped[str | None] = mapped_column(String(2048))

    gst_number: Mapped[str | None] = mapped_column(String(20))
    property_type: Mapped[PropertyType] = mapped_column(
        Enum(PropertyType, name="propertytype"), nullable=False
    )
    lead_source: Mapped[LeadSource] = mapped_column(
        Enum(LeadSource, name="leadsource"), default=LeadSource.OTHER, nullable=False
    )
    notes: Mapped[str | None] = mapped_column(Text)

    # FK
    created_by: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("users.id"), nullable=False
    )

    # Relationships
    created_by_user: Mapped[object] = relationship(
        "User", back_populates="created_customers", foreign_keys=[created_by]
    )
    orders: Mapped[list] = relationship(
        "Order", back_populates="customer", cascade="all, delete-orphan"
    )
    activity_logs: Mapped[list] = relationship(
        "ActivityLog", back_populates="customer"
    )

    def __repr__(self) -> str:
        return f"<Customer {self.customer_id} — {self.name}>"
