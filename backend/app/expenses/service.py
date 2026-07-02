"""PrimeX Services CRM — Expense Service."""

from __future__ import annotations

import logging
from datetime import date

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError, ValidationError
from app.expenses.models import Expense, ExpenseCategory
from app.expenses.repository import ExpenseRepository
from app.expenses.schemas import (
    ExpenseCreate,
    ExpenseListResponse,
    ExpenseResponse,
    ExpenseUpdate,
)

logger = logging.getLogger("primex.expenses")


class ExpenseService:
    def __init__(self, db: AsyncSession) -> None:
        self.repo = ExpenseRepository(db)
        self.db = db

    async def create(self, data: ExpenseCreate, recorded_by: str) -> ExpenseResponse:
        """Record a new expense. Validates category enum."""
        try:
            ExpenseCategory(data.category)
        except ValueError:
            valid = [c.value for c in ExpenseCategory]
            raise ValidationError(f"Invalid category '{data.category}'. Valid: {valid}")

        payload = {
            "category": data.category,
            "description": data.description,
            "amount": float(data.amount),
            "expense_date": data.expense_date,
            "reference": data.reference,
            "recorded_by": recorded_by,
        }
        expense = await self.repo.create(payload)
        logger.info("Expense created: %s category=%s amount=%s", expense.id, data.category, data.amount)
        return self._to_response(expense)

    async def get_by_id(self, expense_id: str) -> ExpenseResponse:
        expense = await self.repo.get_expense(expense_id)
        if not expense:
            raise NotFoundError("Expense", expense_id)
        return self._to_response(expense)

    async def list(
        self,
        page: int = 1,
        per_page: int = 20,
        category: str | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
    ) -> ExpenseListResponse:
        if category:
            try:
                ExpenseCategory(category)
            except ValueError:
                valid = [c.value for c in ExpenseCategory]
                raise ValidationError(f"Invalid category '{category}'. Valid: {valid}")

        expenses, total = await self.repo.list_expenses(
            page=page,
            per_page=per_page,
            category=category,
            date_from=date_from,
            date_to=date_to,
        )
        pagination = self.repo.paginate(total, page, per_page)
        return ExpenseListResponse(
            items=[self._to_response(e) for e in expenses],
            **pagination,
        )

    async def update(self, expense_id: str, data: ExpenseUpdate) -> ExpenseResponse:
        expense = await self.repo.get_expense(expense_id)
        if not expense:
            raise NotFoundError("Expense", expense_id)

        updates = data.model_dump(exclude_none=True)
        if "amount" in updates:
            updates["amount"] = float(updates["amount"])
        if "category" in updates:
            try:
                ExpenseCategory(updates["category"])
            except ValueError:
                valid = [c.value for c in ExpenseCategory]
                raise ValidationError(f"Invalid category '{updates['category']}'. Valid: {valid}")

        updated = await self.repo.update(expense_id, updates)
        logger.info("Expense updated: %s", expense_id)
        return self._to_response(updated or expense)

    async def delete(self, expense_id: str) -> None:
        expense = await self.repo.get_expense(expense_id)
        if not expense:
            raise NotFoundError("Expense", expense_id)
        await self.repo.soft_delete(expense_id)
        logger.info("Expense deleted (soft): %s", expense_id)

    @staticmethod
    def _to_response(expense: Expense) -> ExpenseResponse:
        return ExpenseResponse(
            id=str(expense.id),
            category=expense.category.value if hasattr(expense.category, "value") else expense.category,
            description=expense.description,
            amount=float(expense.amount),
            expense_date=expense.expense_date,
            reference=expense.reference,
            recorded_by=str(expense.recorded_by),
            is_deleted=expense.is_deleted,
            created_at=expense.created_at,
            updated_at=expense.updated_at,
        )
