"""PrimeX Services CRM — Payment Repository."""

from __future__ import annotations

import logging
from datetime import date

from sqlalchemy import DECIMAL, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.repository import BaseRepository
from app.payments.models import Payment

logger = logging.getLogger("primex.payments")


class PaymentRepository(BaseRepository[Payment]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(Payment, session)

    async def create_payment(self, data: dict) -> Payment:
        """Create a payment record. Caller must commit the session."""
        payment = await self.create(data)
        logger.info("Payment created: id=%s order_id=%s amount=%s", payment.id, payment.order_id, payment.amount)
        return payment

    async def get_payment(self, payment_id: str) -> Payment | None:
        """Fetch a single non-deleted payment."""
        result = await self.session.execute(
            select(Payment)
            .where(Payment.id == payment_id, Payment.is_deleted == False)  # noqa: E712
            .options(selectinload(Payment.order), selectinload(Payment.recorded_by_user))
        )
        return result.scalar_one_or_none()

    async def get_payments(
        self,
        page: int = 1,
        per_page: int = 20,
        order_id: str | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
    ) -> tuple[list[Payment], int]:
        """List payments with optional filters and pagination."""
        stmt = (
            select(Payment)
            .where(Payment.is_deleted == False)  # noqa: E712
            .options(selectinload(Payment.order))
        )

        if order_id:
            stmt = stmt.where(Payment.order_id == order_id)
        if date_from:
            stmt = stmt.where(func.date(Payment.paid_at) >= date_from)
        if date_to:
            stmt = stmt.where(func.date(Payment.paid_at) <= date_to)

        count_q = select(func.count()).select_from(stmt.subquery())
        total = (await self.session.execute(count_q)).scalar_one()

        stmt = stmt.order_by(Payment.paid_at.desc())
        stmt = stmt.offset((page - 1) * per_page).limit(per_page)

        result = await self.session.execute(stmt)
        return list(result.scalars().all()), total

    async def void_payment(self, payment_id: str) -> bool:
        """Soft-delete a payment (void it)."""
        success = await self.soft_delete(payment_id)
        if success:
            logger.info("Payment voided: id=%s", payment_id)
        return success

    async def sum_payments_for_order(self, order_id: str) -> float:
        """Return total non-voided payments received for a given order."""
        result = await self.session.execute(
            select(func.coalesce(func.sum(Payment.amount), 0))
            .where(Payment.order_id == order_id, Payment.is_deleted == False)  # noqa: E712
        )
        return float(result.scalar_one())
