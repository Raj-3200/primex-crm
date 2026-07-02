"""PrimeX Services CRM — Payment Router."""

from __future__ import annotations

from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import CurrentUser
from app.payments.schemas import PaymentCreate, PaymentListResponse, PaymentResponse
from app.payments.service import PaymentService

router = APIRouter(tags=["Payments"])


@router.post("", response_model=PaymentResponse, status_code=201)
async def record_payment(
    data: PaymentCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: CurrentUser,
) -> PaymentResponse:
    """Record a payment against a service order."""
    return await PaymentService(db).create(data, recorded_by=str(current_user.id))


@router.get("", response_model=PaymentListResponse)
async def list_payments(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: CurrentUser,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    order_id: str | None = Query(None, description="Filter payments by order UUID"),
    date_from: date | None = Query(None, description="Filter payments paid on or after this date (YYYY-MM-DD)"),
    date_to: date | None = Query(None, description="Filter payments paid on or before this date (YYYY-MM-DD)"),
) -> PaymentListResponse:
    """List payments with optional order and date-range filters."""
    return await PaymentService(db).list(
        page=page,
        per_page=per_page,
        order_id=order_id,
        date_from=date_from,
        date_to=date_to,
    )


@router.get("/{payment_id}", response_model=PaymentResponse)
async def get_payment(
    payment_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: CurrentUser,
) -> PaymentResponse:
    """Get a single payment by ID."""
    return await PaymentService(db).get_by_id(payment_id)


@router.delete("/{payment_id}", status_code=200)
async def void_payment(
    payment_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: CurrentUser,
) -> dict:
    """Void (soft-delete) a payment. The record is retained for audit purposes."""
    await PaymentService(db).void(payment_id)
    return {"message": "Payment voided successfully"}
