"""PrimeX Services CRM — Expense Repository."""

from __future__ import annotations

import logging
from datetime import date

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.repository import BaseRepository
from app.expenses.models import Expense

logger = logging.getLogger("primex.expenses")


class ExpenseRepository(BaseRepository[Expense]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(Expense, session)

    async def get_expense(self, expense_id: str) -> Expense | None:
        """Fetch a single non-deleted expense."""
        result = await self.session.execute(
            select(Expense).where(
                Expense.id == expense_id,
                Expense.is_deleted == False,  # noqa: E712
            )
        )
        return result.scalar_one_or_none()

    async def list_expenses(
        self,
        page: int = 1,
        per_page: int = 20,
        category: str | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
    ) -> tuple[list[Expense], int]:
        """List expenses with optional category + date range filters."""
        stmt = select(Expense).where(Expense.is_deleted == False)  # noqa: E712

        if category:
            stmt = stmt.where(Expense.category == category)
        if date_from:
            stmt = stmt.where(Expense.expense_date >= date_from)
        if date_to:
            stmt = stmt.where(Expense.expense_date <= date_to)

        count_q = select(func.count()).select_from(stmt.subquery())
        total = (await self.session.execute(count_q)).scalar_one()

        stmt = stmt.order_by(Expense.expense_date.desc())
        stmt = stmt.offset((page - 1) * per_page).limit(per_page)

        result = await self.session.execute(stmt)
        return list(result.scalars().all()), total
