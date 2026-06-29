"""PrimeX Services CRM — Customer Router."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import CurrentUser
from app.customers.schemas import (
    CustomerCreate,
    CustomerListResponse,
    CustomerResponse,
    CustomerUpdate,
    TimelineEvent,
)
from app.customers.service import CustomerService

router = APIRouter(prefix="/customers", tags=["Customers"])


@router.get("", response_model=CustomerListResponse)
async def list_customers(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: CurrentUser,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: str = Query("", max_length=200),
    property_type: str | None = Query(None),
    lead_source: str | None = Query(None),
) -> CustomerListResponse:
    """List all customers with pagination, search, and filtering."""
    return await CustomerService(db).list(
        page=page,
        per_page=per_page,
        search=search,
        property_type=property_type,
        lead_source=lead_source,
    )


@router.post("", response_model=CustomerResponse, status_code=201)
async def create_customer(
    data: CustomerCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: CurrentUser,
) -> CustomerResponse:
    """Create a new customer record."""
    return await CustomerService(db).create(data, created_by=str(current_user.id))


@router.get("/{id}", response_model=CustomerResponse)
async def get_customer(
    id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: CurrentUser,
) -> CustomerResponse:
    """Get a single customer by ID."""
    return await CustomerService(db).get_by_id(id)


@router.put("/{id}", response_model=CustomerResponse)
async def update_customer(
    id: str,
    data: CustomerUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: CurrentUser,
) -> CustomerResponse:
    """Update a customer record."""
    return await CustomerService(db).update(id, data, updated_by=str(current_user.id))


@router.delete("/{id}", status_code=204)
async def delete_customer(
    id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: CurrentUser,
) -> None:
    """Soft-delete a customer (marks as deleted, data retained)."""
    await CustomerService(db).delete(id, deleted_by=str(current_user.id))


@router.get("/{id}/timeline", response_model=list[TimelineEvent])
async def get_customer_timeline(
    id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: CurrentUser,
) -> list[TimelineEvent]:
    """Get the full activity timeline for a customer."""
    return await CustomerService(db).get_timeline(id)
