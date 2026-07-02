"""
PrimeX Services CRM — Document Model.
"""

from __future__ import annotations

from sqlalchemy import BigInteger, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.base_model import Base, SoftDeleteMixin, TimestampMixin, UUIDMixin


class Document(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    """
    Uploaded file record attached to any CRM entity.
    Uses a polymorphic pattern: (entity_type, entity_id) points to
    customers, orders, expenses, etc. without hard FK coupling.
    """

    __tablename__ = "documents"

    # Polymorphic entity reference
    entity_type: Mapped[str] = mapped_column(
        String(50), nullable=False, index=True
    )  # e.g. 'customer', 'order', 'expense'
    entity_id: Mapped[str] = mapped_column(
        String(36), nullable=False, index=True
    )  # UUID of the linked entity

    # File metadata
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_url: Mapped[str] = mapped_column(Text, nullable=False)
    file_type: Mapped[str] = mapped_column(String(100), nullable=False)
    file_size: Mapped[int] = mapped_column(BigInteger, nullable=False)

    # FK — who uploaded this document
    uploaded_by: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("users.id"), nullable=False
    )

    # Relationships
    uploaded_by_user: Mapped[object] = relationship(
        "User", foreign_keys=[uploaded_by], back_populates="uploaded_documents"
    )

    def __repr__(self) -> str:
        return f"<Document {self.id} — {self.name} [{self.entity_type}:{self.entity_id}]>"
