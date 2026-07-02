"""PrimeX Services CRM — Expense Router."""

from __future__ import annotations

from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import CurrentUser
from app.expenses.schemas import (
    ExpenseCreate,
    ExpenseListResponse,
    ExpenseResponse,
    ExpenseUpdate,
)
from app.expenses.service import ExpenseService

router = APIRouter(tags=["Expenses"])


@router.post("", response_model=ExpenseResponse, status_code=201)
async def create_expense(
    data: ExpenseCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: CurrentUser,
) -> ExpenseResponse:
    """Record a new business expense."""
    return await ExpenseService(db).create(data, recorded_by=str(current_user.id))


@router.get("", response_model=ExpenseListResponse)
async def list_expenses(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: CurrentUser,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    category: str | None = Query(None, description="Filter by expense category"),
    date_from: date | None = Query(None, description="Expenses on or after this date (YYYY-MM-DD)"),
    date_to: date | None = Query(None, description="Expenses on or before this date (YYYY-MM-DD)"),
) -> ExpenseListResponse:
    """List expenses with optional category and date-range filters."""
    return await ExpenseService(db).list(
        page=page,
        per_page=per_page,
        category=category,
        date_from=date_from,
        date_to=date_to,
    )


@router.get("/{expense_id}", response_model=ExpenseResponse)
async def get_expense(
    expense_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: CurrentUser,
) -> ExpenseResponse:
    """Get a single expense by ID."""
    return await ExpenseService(db).get_by_id(expense_id)


@router.patch("/{expense_id}", response_model=ExpenseResponse)
async def update_expense(
    expense_id: str,
    data: ExpenseUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: CurrentUser,
) -> ExpenseResponse:
    """Partially update an expense record."""
    return await ExpenseService(db).update(expense_id, data)


@router.delete("/{expense_id}", status_code=200)
async def delete_expense(
    expense_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: CurrentUser,
) -> dict:
    """Soft-delete an expense record."""
    await ExpenseService(db).delete(expense_id)
    return {"message": "Expense deleted successfully"}
