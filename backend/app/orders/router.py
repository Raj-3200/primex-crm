"""PrimeX Services CRM — Order Router."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import CurrentUser
from app.orders.schemas import (
    OrderCreate,
    OrderListResponse,
    OrderResponse,
    OrderStatusUpdate,
    OrderUpdate,
)
from app.orders.service import OrderService

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.get("", response_model=OrderListResponse)
async def list_orders(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: CurrentUser,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status: str | None = Query(None),
    service_type: str | None = Query(None),
    customer_id: str | None = Query(None),
    search: str | None = Query(None),
) -> OrderListResponse:
    """List orders with filters and pagination."""
    return await OrderService(db).list(
        page=page,
        per_page=per_page,
        status=status,
        service_type=service_type,
        customer_id=customer_id,
        search=search,
    )


@router.post("", response_model=OrderResponse, status_code=201)
async def create_order(
    data: OrderCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: CurrentUser,
) -> OrderResponse:
    """Create a new service order with solar/tank detail."""
    return await OrderService(db).create(data, created_by=str(current_user.id))


@router.get("/{id}", response_model=OrderResponse)
async def get_order(
    id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: CurrentUser,
) -> OrderResponse:
    """Get a single order with full service details."""
    return await OrderService(db).get_by_id(id)


@router.put("/{id}", response_model=OrderResponse)
async def update_order(
    id: str,
    data: OrderUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: CurrentUser,
) -> OrderResponse:
    """Update an order's details and service information."""
    return await OrderService(db).update(id, data, updated_by=str(current_user.id))


@router.patch("/{id}/status", response_model=OrderResponse)
async def update_order_status(
    id: str,
    data: OrderStatusUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: CurrentUser,
) -> OrderResponse:
    """Update only the status of an order (e.g., PENDING → SCHEDULED → COMPLETED)."""
    return await OrderService(db).update_status(id, data, updated_by=str(current_user.id))


@router.delete("/{id}", status_code=204)
async def delete_order(
    id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: CurrentUser,
) -> None:
    """Soft-delete an order."""
    await OrderService(db).delete(id, deleted_by=str(current_user.id))
