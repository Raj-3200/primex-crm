"""PrimeX Services CRM — Expense Pydantic Schemas."""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class ExpenseCreate(BaseModel):
    category: str = Field(
        description="Category: VEHICLE | EQUIPMENT | SUPPLIES | STAFF | UTILITIES | OTHER"
    )
    description: str = Field(min_length=3)
    amount: Decimal = Field(gt=0, decimal_places=2)
    expense_date: date
    reference: str | None = Field(default=None, max_length=255)


class ExpenseUpdate(BaseModel):
    category: str | None = None
    description: str | None = Field(default=None, min_length=3)
    amount: Decimal | None = Field(default=None, gt=0, decimal_places=2)
    expense_date: date | None = None
    reference: str | None = None


class ExpenseResponse(BaseModel):
    id: str
    category: str
    description: str
    amount: float
    expense_date: date
    reference: str | None
    recorded_by: str
    is_deleted: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ExpenseListResponse(BaseModel):
    items: list[ExpenseResponse]
    total: int
    page: int
    per_page: int
    pages: int
