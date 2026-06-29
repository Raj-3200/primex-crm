"""PrimeX Services CRM — Customer Repository."""

from __future__ import annotations

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.repository import BaseRepository
from app.customers.models import Customer


class CustomerRepository(BaseRepository[Customer]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(Customer, session)

    async def get_next_customer_id(self) -> str:
        """Generate the next sequential customer ID: PX-C-0001."""
        result = await self.session.execute(
            select(func.count(Customer.id)).where(Customer.is_deleted == False)  # noqa
        )
        count = result.scalar_one()
        return f"PX-C-{count + 1:04d}"

    async def search(
        self,
        query: str,
        page: int = 1,
        per_page: int = 20,
        property_type: str | None = None,
        lead_source: str | None = None,
    ) -> tuple[list[Customer], int]:
        stmt = select(Customer).where(Customer.is_deleted == False)  # noqa

        if query:
            search_term = f"%{query}%"
            stmt = stmt.where(
                or_(
                    Customer.name.ilike(search_term),
                    Customer.phone.ilike(search_term),
                    Customer.customer_id.ilike(search_term),
                    Customer.email.ilike(search_term),
                )
            )

        if property_type:
            stmt = stmt.where(Customer.property_type == property_type)

        if lead_source:
            stmt = stmt.where(Customer.lead_source == lead_source)

        count_query = select(func.count()).select_from(stmt.subquery())
        total = (await self.session.execute(count_query)).scalar_one()

        stmt = stmt.order_by(Customer.created_at.desc())
        stmt = stmt.offset((page - 1) * per_page).limit(per_page)

        result = await self.session.execute(stmt)
        return list(result.scalars().all()), total

    async def get_with_orders(self, id: str) -> Customer | None:
        result = await self.session.execute(
            select(Customer)
            .where(Customer.id == id, Customer.is_deleted == False)  # noqa
            .options(selectinload(Customer.orders))
        )
        return result.scalar_one_or_none()
