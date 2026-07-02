"""PrimeX Services CRM — Payment Pydantic Schemas."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class PaymentCreate(BaseModel):
    order_id: str = Field(description="UUID of the associated order")
    amount: Decimal = Field(gt=0, decimal_places=2, description="Payment amount (positive)")
    method: str = Field(description="Payment method: CASH | UPI | BANK | CHEQUE")
    reference_number: str | None = Field(default=None, max_length=255)
    notes: str | None = None
    paid_at: datetime | None = Field(
        default=None,
        description="When the payment was received (defaults to now if omitted)",
    )


class PaymentResponse(BaseModel):
    id: str
    order_id: str
    amount: float
    method: str
    reference_number: str | None
    notes: str | None
    paid_at: datetime
    recorded_by: str
    is_deleted: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PaymentListResponse(BaseModel):
    items: list[PaymentResponse]
    total: int
    page: int
    per_page: int
    pages: int
