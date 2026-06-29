"""PrimeX Services CRM — Order Repository."""

from __future__ import annotations

from datetime import date

from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.repository import BaseRepository
from app.orders.models import Order, OrderStatus


class OrderRepository(BaseRepository[Order]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(Order, session)

    async def get_next_order_number(self) -> str:
        """Generate sequential order number: PX-ORD-2026-0001."""
        from datetime import datetime
        year = datetime.now().year
        result = await self.session.execute(
            select(func.count(Order.id)).where(Order.is_deleted == False)  # noqa
        )
        count = result.scalar_one()
        return f"PX-ORD-{year}-{count + 1:04d}"

    async def get_with_details(self, id: str) -> Order | None:
        result = await self.session.execute(
            select(Order)
            .where(Order.id == id, Order.is_deleted == False)  # noqa
            .options(
                selectinload(Order.solar_detail),
                selectinload(Order.tank_detail),
                selectinload(Order.customer),
            )
        )
        return result.scalar_one_or_none()

    async def list_with_filters(
        self,
        page: int = 1,
        per_page: int = 20,
        status: str | None = None,
        service_type: str | None = None,
        customer_id: str | None = None,
        search: str | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
    ) -> tuple[list[Order], int]:
        stmt = (
            select(Order)
            .where(Order.is_deleted == False)  # noqa
            .options(selectinload(Order.customer))
        )

        if status:
            stmt = stmt.where(Order.status == status)
        if service_type:
            stmt = stmt.where(Order.service_type == service_type)
        if customer_id:
            stmt = stmt.where(Order.customer_id == customer_id)
        if date_from:
            stmt = stmt.where(Order.scheduled_date >= date_from)
        if date_to:
            stmt = stmt.where(Order.scheduled_date <= date_to)
        if search:
            stmt = stmt.where(Order.order_number.ilike(f"%{search}%"))

        count_q = select(func.count()).select_from(stmt.subquery())
        total = (await self.session.execute(count_q)).scalar_one()

        stmt = stmt.order_by(Order.created_at.desc())
        stmt = stmt.offset((page - 1) * per_page).limit(per_page)

        result = await self.session.execute(stmt)
        return list(result.scalars().all()), total

    async def get_upcoming(self, limit: int = 10) -> list[Order]:
        from datetime import datetime
        today = datetime.now().date()
        result = await self.session.execute(
            select(Order)
            .where(
                and_(
                    Order.is_deleted == False,  # noqa
                    Order.scheduled_date >= today,
                    Order.status.in_([OrderStatus.PENDING, OrderStatus.SCHEDULED]),
                )
            )
            .options(selectinload(Order.customer))
            .order_by(Order.scheduled_date.asc())
            .limit(limit)
        )
        return list(result.scalars().all())
