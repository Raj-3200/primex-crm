"""PrimeX Services CRM — Payment Service."""

from __future__ import annotations

import logging
from datetime import date, datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError, ValidationError
from app.payments.models import Payment, PaymentMethod
from app.payments.repository import PaymentRepository
from app.payments.schemas import PaymentCreate, PaymentListResponse, PaymentResponse

logger = logging.getLogger("primex.payments")


class PaymentService:
    def __init__(self, db: AsyncSession) -> None:
        self.repo = PaymentRepository(db)
        self.db = db

    async def create(self, data: PaymentCreate, recorded_by: str) -> PaymentResponse:
        """Record a payment against an order. Validates method enum."""
        # Validate payment method
        try:
            PaymentMethod(data.method)
        except ValueError:
            valid = [m.value for m in PaymentMethod]
            raise ValidationError(f"Invalid payment method '{data.method}'. Valid: {valid}")

        # Verify order exists (lightweight check via FK cascade will guard the DB)
        from app.orders.models import Order
        from sqlalchemy import select

        result = await self.db.execute(
            select(Order).where(Order.id == data.order_id, Order.is_deleted == False)  # noqa: E712
        )
        order = result.scalar_one_or_none()
        if not order:
            raise NotFoundError("Order", data.order_id)

        paid_at = data.paid_at or datetime.now(timezone.utc)

        payload = {
            "order_id": data.order_id,
            "amount": float(data.amount),
            "method": data.method,
            "reference_number": data.reference_number,
            "notes": data.notes,
            "paid_at": paid_at,
            "recorded_by": recorded_by,
        }

        payment = await self.repo.create_payment(payload)
        logger.info("Payment recorded: %s for order %s by user %s", payment.id, data.order_id, recorded_by)
        return self._to_response(payment)

    async def get_by_id(self, payment_id: str) -> PaymentResponse:
        payment = await self.repo.get_payment(payment_id)
        if not payment:
            raise NotFoundError("Payment", payment_id)
        return self._to_response(payment)

    async def list(
        self,
        page: int = 1,
        per_page: int = 20,
        order_id: str | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
    ) -> PaymentListResponse:
        payments, total = await self.repo.get_payments(
            page=page,
            per_page=per_page,
            order_id=order_id,
            date_from=date_from,
            date_to=date_to,
        )
        pagination = self.repo.paginate(total, page, per_page)
        return PaymentListResponse(
            items=[self._to_response(p) for p in payments],
            **pagination,
        )

    async def void(self, payment_id: str) -> None:
        """Soft-delete (void) a payment. Raises 404 if not found."""
        payment = await self.repo.get_payment(payment_id)
        if not payment:
            raise NotFoundError("Payment", payment_id)
        await self.repo.void_payment(payment_id)
        logger.info("Payment voided: %s", payment_id)

    @staticmethod
    def _to_response(payment: Payment) -> PaymentResponse:
        return PaymentResponse(
            id=str(payment.id),
            order_id=str(payment.order_id),
            amount=float(payment.amount),
            method=payment.method.value if hasattr(payment.method, "value") else payment.method,
            reference_number=payment.reference_number,
            notes=payment.notes,
            paid_at=payment.paid_at,
            recorded_by=str(payment.recorded_by),
            is_deleted=payment.is_deleted,
            created_at=payment.created_at,
            updated_at=payment.updated_at,
        )
