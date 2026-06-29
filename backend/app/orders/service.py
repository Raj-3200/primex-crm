"""PrimeX Services CRM — Order Service."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.activity.models import ActivityLog
from app.core.exceptions import NotFoundError, ValidationError
from app.customers.repository import CustomerRepository
from app.orders.models import (
    Order,
    OrderStatus,
    ServiceType,
    SolarCleaningDetail,
    TankCleaningDetail,
)
from app.orders.repository import OrderRepository
from app.orders.schemas import (
    OrderCreate,
    OrderListResponse,
    OrderResponse,
    OrderStatusUpdate,
    OrderUpdate,
    SolarDetailResponse,
    TankDetailResponse,
)


class OrderService:
    def __init__(self, db: AsyncSession) -> None:
        self.repo = OrderRepository(db)
        self.customer_repo = CustomerRepository(db)
        self.db = db

    async def create(self, data: OrderCreate, created_by: str) -> OrderResponse:
        # Validate customer exists
        customer = await self.customer_repo.get_by_id(data.customer_id)
        if not customer or customer.is_deleted:
            raise NotFoundError("Customer", data.customer_id)

        # Validate service detail presence
        if data.service_type == ServiceType.SOLAR and not data.solar_detail:
            raise ValidationError("Solar cleaning orders require solar_detail")
        if data.service_type == ServiceType.TANK and not data.tank_detail:
            raise ValidationError("Tank cleaning orders require tank_detail")

        # Compute pricing
        tax_amount = (data.subtotal - data.discount) * (data.tax_rate / 100)
        total_amount = data.subtotal - data.discount + tax_amount

        order_number = await self.repo.get_next_order_number()
        order = await self.repo.create(
            {
                "order_number": order_number,
                "customer_id": data.customer_id,
                "service_type": data.service_type,
                "scheduled_date": data.scheduled_date,
                "scheduled_time": data.scheduled_time,
                "subtotal": data.subtotal,
                "discount": data.discount,
                "tax_rate": data.tax_rate,
                "tax_amount": tax_amount,
                "total_amount": total_amount,
                "notes": data.notes,
                "assigned_to": data.assigned_to,
                "created_by": created_by,
            }
        )

        # Create service details
        if data.solar_detail:
            solar = SolarCleaningDetail(
                order_id=str(order.id),
                **data.solar_detail.model_dump(),
            )
            self.db.add(solar)

        if data.tank_detail:
            tank = TankCleaningDetail(
                order_id=str(order.id),
                **data.tank_detail.model_dump(),
            )
            self.db.add(tank)

        await self.db.flush()

        # Log activity
        await self._log(order, "order_created", created_by, {"order_number": order_number})

        # Reload with relations
        full_order = await self.repo.get_with_details(str(order.id))
        return self._to_response(full_order or order)

    async def get_by_id(self, id: str) -> OrderResponse:
        order = await self.repo.get_with_details(id)
        if not order:
            raise NotFoundError("Order", id)
        return self._to_response(order)

    async def list(
        self,
        page: int = 1,
        per_page: int = 20,
        status: str | None = None,
        service_type: str | None = None,
        customer_id: str | None = None,
        search: str | None = None,
    ) -> OrderListResponse:
        orders, total = await self.repo.list_with_filters(
            page=page,
            per_page=per_page,
            status=status,
            service_type=service_type,
            customer_id=customer_id,
            search=search,
        )
        pagination = self.repo.paginate(total, page, per_page)
        return OrderListResponse(
            items=[self._to_response(o) for o in orders], **pagination
        )

    async def update(self, id: str, data: OrderUpdate, updated_by: str) -> OrderResponse:
        order = await self.repo.get_with_details(id)
        if not order:
            raise NotFoundError("Order", id)

        update_dict = data.model_dump(exclude_none=True, exclude={"solar_detail", "tank_detail"})

        # Recompute pricing if needed
        subtotal = update_dict.get("subtotal", float(order.subtotal))
        discount = update_dict.get("discount", float(order.discount))
        tax_rate = update_dict.get("tax_rate", float(order.tax_rate))
        tax_amount = (subtotal - discount) * (tax_rate / 100)
        total_amount = subtotal - discount + tax_amount
        update_dict.update({"tax_amount": tax_amount, "total_amount": total_amount})

        await self.repo.update(id, update_dict)

        # Update solar detail
        if data.solar_detail and order.solar_detail:
            solar_data = data.solar_detail.model_dump(exclude_none=True)
            for k, v in solar_data.items():
                setattr(order.solar_detail, k, v)

        # Update tank detail
        if data.tank_detail and order.tank_detail:
            tank_data = data.tank_detail.model_dump(exclude_none=True)
            for k, v in tank_data.items():
                setattr(order.tank_detail, k, v)

        await self.db.flush()
        await self._log(order, "order_updated", updated_by, update_dict)

        full = await self.repo.get_with_details(id)
        return self._to_response(full or order)

    async def update_status(
        self, id: str, data: OrderStatusUpdate, updated_by: str
    ) -> OrderResponse:
        order = await self.repo.get_by_id(id)
        if not order:
            raise NotFoundError("Order", id)

        try:
            new_status = OrderStatus(data.status)
        except ValueError:
            raise ValidationError(f"Invalid status: {data.status}")

        update_data: dict = {"status": new_status}
        if new_status == OrderStatus.COMPLETED:
            update_data["completed_at"] = datetime.utcnow()

        await self.repo.update(id, update_data)
        await self._log(
            order, "status_changed", updated_by,
            {"from": order.status.value, "to": data.status, "notes": data.notes}
        )

        full = await self.repo.get_with_details(id)
        return self._to_response(full or order)

    async def delete(self, id: str, deleted_by: str) -> None:
        order = await self.repo.get_by_id(id)
        if not order or order.is_deleted:
            raise NotFoundError("Order", id)
        await self.repo.soft_delete(id)
        await self._log(order, "order_deleted", deleted_by, {})

    async def _log(
        self, order: Order, action: str, user_id: str, details: dict
    ) -> None:
        log = ActivityLog(
            entity_type="order",
            entity_id=str(order.id),
            action=action,
            details=details,
            user_id=user_id,
            customer_id=str(order.customer_id),
            order_id=str(order.id),
        )
        self.db.add(log)
        await self.db.flush()

    @staticmethod
    def _to_response(order: Order) -> OrderResponse:
        solar = None
        if hasattr(order, "solar_detail") and order.solar_detail:
            s = order.solar_detail
            solar = SolarDetailResponse(
                id=str(s.id),
                panel_count=s.panel_count,
                capacity_kw=float(s.capacity_kw),
                roof_type=s.roof_type.value,
                panel_type=s.panel_type.value,
                before_photos=s.before_photos or [],
                after_photos=s.after_photos or [],
                remarks=s.remarks,
            )

        tank = None
        if hasattr(order, "tank_detail") and order.tank_detail:
            t = order.tank_detail
            tank = TankDetailResponse(
                id=str(t.id),
                tank_type=t.tank_type.value,
                capacity_liters=t.capacity_liters,
                number_of_tanks=t.number_of_tanks,
                before_photos=t.before_photos or [],
                after_photos=t.after_photos or [],
                chemical_used=t.chemical_used,
                remarks=t.remarks,
            )

        customer_name = ""
        if hasattr(order, "customer") and order.customer:
            customer_name = order.customer.name

        return OrderResponse(
            id=str(order.id),
            order_number=order.order_number,
            customer_id=str(order.customer_id),
            customer_name=customer_name,
            service_type=order.service_type.value,
            status=order.status.value,
            scheduled_date=order.scheduled_date,
            scheduled_time=order.scheduled_time,
            completed_at=order.completed_at,
            subtotal=float(order.subtotal),
            discount=float(order.discount),
            tax_rate=float(order.tax_rate),
            tax_amount=float(order.tax_amount),
            total_amount=float(order.total_amount),
            notes=order.notes,
            assigned_to=str(order.assigned_to) if order.assigned_to else None,
            created_at=order.created_at,
            updated_at=order.updated_at,
            solar_detail=solar,
            tank_detail=tank,
        )
