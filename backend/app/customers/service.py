"""PrimeX Services CRM — Customer Service."""

from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.customers.models import Customer
from app.customers.repository import CustomerRepository
from app.customers.schemas import (
    CustomerCreate,
    CustomerListResponse,
    CustomerResponse,
    CustomerUpdate,
    TimelineEvent,
)
from app.core.exceptions import NotFoundError
from app.activity.models import ActivityLog
from sqlalchemy import select
from datetime import datetime


class CustomerService:
    def __init__(self, db: AsyncSession) -> None:
        self.repo = CustomerRepository(db)
        self.db = db

    async def create(self, data: CustomerCreate, created_by: str) -> CustomerResponse:
        customer_id = await self.repo.get_next_customer_id()
        customer = await self.repo.create(
            {
                **data.model_dump(),
                "customer_id": customer_id,
                "created_by": created_by,
            }
        )
        # Log activity
        await self._log_activity(
            "customer", str(customer.id), "created",
            {"customer_id": customer_id, "name": customer.name},
            user_id=created_by, customer_id=str(customer.id),
        )
        return self._to_response(customer)

    async def get_by_id(self, id: str) -> CustomerResponse:
        customer = await self.repo.get_by_id(id)
        if not customer or customer.is_deleted:
            raise NotFoundError("Customer", id)
        return self._to_response(customer)

    async def list(
        self,
        page: int = 1,
        per_page: int = 20,
        search: str = "",
        property_type: str | None = None,
        lead_source: str | None = None,
    ) -> CustomerListResponse:
        customers, total = await self.repo.search(
            query=search,
            page=page,
            per_page=per_page,
            property_type=property_type,
            lead_source=lead_source,
        )
        pagination = self.repo.paginate(total, page, per_page)
        return CustomerListResponse(
            items=[self._to_response(c) for c in customers],
            **pagination,
        )

    async def update(
        self, id: str, data: CustomerUpdate, updated_by: str
    ) -> CustomerResponse:
        customer = await self.repo.get_by_id(id)
        if not customer or customer.is_deleted:
            raise NotFoundError("Customer", id)

        updated = await self.repo.update(id, data.model_dump(exclude_none=True))
        await self._log_activity(
            "customer", id, "updated",
            data.model_dump(exclude_none=True),
            user_id=updated_by, customer_id=id,
        )
        return self._to_response(updated or customer)

    async def delete(self, id: str, deleted_by: str) -> None:
        customer = await self.repo.get_by_id(id)
        if not customer or customer.is_deleted:
            raise NotFoundError("Customer", id)
        await self.repo.soft_delete(id)
        await self._log_activity(
            "customer", id, "deleted", {}, user_id=deleted_by, customer_id=id
        )

    async def get_timeline(self, id: str) -> list[TimelineEvent]:
        customer = await self.repo.get_by_id(id)
        if not customer or customer.is_deleted:
            raise NotFoundError("Customer", id)

        result = await self.db.execute(
            select(ActivityLog)
            .where(ActivityLog.customer_id == id)
            .order_by(ActivityLog.created_at.desc())
            .limit(50)
        )
        logs = result.scalars().all()

        events: list[TimelineEvent] = [
            TimelineEvent(
                id=str(log.id),
                type=log.action,
                title=log.action.replace("_", " ").title(),
                description=str(log.details or ""),
                date=log.created_at,
                metadata=log.details or {},
            )
            for log in logs
        ]

        # Add creation event at the end
        events.append(
            TimelineEvent(
                id=f"created-{customer.id}",
                type="customer_created",
                title="Customer Created",
                description=f"Customer {customer.customer_id} was added to the CRM",
                date=customer.created_at,
            )
        )
        return events

    async def _log_activity(
        self,
        entity_type: str,
        entity_id: str,
        action: str,
        details: dict,
        user_id: str,
        customer_id: str | None = None,
    ) -> None:
        log = ActivityLog(
            entity_type=entity_type,
            entity_id=entity_id,
            action=action,
            details=details,
            user_id=user_id,
            customer_id=customer_id,
        )
        self.db.add(log)
        await self.db.flush()

    @staticmethod
    def _to_response(customer: Customer) -> CustomerResponse:
        return CustomerResponse(
            id=str(customer.id),
            customer_id=customer.customer_id,
            name=customer.name,
            phone=customer.phone,
            alternate_phone=customer.alternate_phone,
            email=customer.email,
            address=customer.address,
            latitude=customer.latitude,
            longitude=customer.longitude,
            maps_url=customer.maps_url,
            gst_number=customer.gst_number,
            property_type=customer.property_type.value,
            lead_source=customer.lead_source.value,
            notes=customer.notes,
            created_at=customer.created_at,
            updated_at=customer.updated_at,
        )
