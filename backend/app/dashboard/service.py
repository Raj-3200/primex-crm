"""PrimeX Services CRM — Dashboard Service."""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.activity.models import ActivityLog
from app.customers.models import Customer
from app.dashboard.schemas import (
    DashboardResponse,
    DashboardStats,
    RecentActivity,
    RevenueDataPoint,
    ServiceDistribution,
    UpcomingJob,
)
from app.orders.models import Order, OrderStatus, ServiceType
from app.orders.repository import OrderRepository


class DashboardService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.order_repo = OrderRepository(db)

    async def get_dashboard(self) -> DashboardResponse:
        stats = await self._get_stats()
        revenue_chart = await self._get_revenue_chart()
        distribution = await self._get_service_distribution()
        upcoming = await self._get_upcoming_jobs()
        activity = await self._get_recent_activity()

        return DashboardResponse(
            stats=stats,
            revenue_chart=revenue_chart,
            service_distribution=distribution,
            upcoming_jobs=upcoming,
            recent_activity=activity,
        )

    async def _get_stats(self) -> DashboardStats:
        now = datetime.now(timezone.utc)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        year_start = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)

        # Revenue (completed orders only)
        async def revenue_for_period(start: datetime) -> float:
            result = await self.db.execute(
                select(func.coalesce(func.sum(Order.total_amount), 0)).where(
                    and_(
                        Order.is_deleted == False,  # noqa
                        Order.status == OrderStatus.COMPLETED,
                        Order.completed_at >= start,
                    )
                )
            )
            return float(result.scalar_one())

        today_revenue = await revenue_for_period(today_start)
        monthly_revenue = await revenue_for_period(month_start)
        yearly_revenue = await revenue_for_period(year_start)

        # Outstanding (pending/scheduled orders total)
        outstanding_result = await self.db.execute(
            select(func.coalesce(func.sum(Order.total_amount), 0)).where(
                and_(
                    Order.is_deleted == False,  # noqa
                    Order.status.in_([OrderStatus.PENDING, OrderStatus.SCHEDULED]),
                )
            )
        )
        total_outstanding = float(outstanding_result.scalar_one())

        # Today's jobs
        today_jobs_result = await self.db.execute(
            select(func.count(Order.id)).where(
                and_(
                    Order.is_deleted == False,  # noqa
                    Order.scheduled_date == now.date(),
                )
            )
        )
        today_jobs = today_jobs_result.scalar_one()

        # Upcoming jobs
        upcoming_result = await self.db.execute(
            select(func.count(Order.id)).where(
                and_(
                    Order.is_deleted == False,  # noqa
                    Order.scheduled_date > now.date(),
                    Order.status.in_([OrderStatus.PENDING, OrderStatus.SCHEDULED]),
                )
            )
        )
        upcoming_jobs = upcoming_result.scalar_one()

        # Total / completed orders
        total_orders_result = await self.db.execute(
            select(func.count(Order.id)).where(Order.is_deleted == False)  # noqa
        )
        total_orders = total_orders_result.scalar_one()

        completed_result = await self.db.execute(
            select(func.count(Order.id)).where(
                and_(Order.is_deleted == False, Order.status == OrderStatus.COMPLETED)  # noqa
            )
        )
        completed_orders = completed_result.scalar_one()

        # Customers
        total_customers_result = await self.db.execute(
            select(func.count(Customer.id)).where(Customer.is_deleted == False)  # noqa
        )
        total_customers = total_customers_result.scalar_one()

        new_customers_result = await self.db.execute(
            select(func.count(Customer.id)).where(
                and_(Customer.is_deleted == False, Customer.created_at >= month_start)  # noqa
            )
        )
        new_customers_this_month = new_customers_result.scalar_one()

        # Solar/Tank this month
        solar_result = await self.db.execute(
            select(func.count(Order.id)).where(
                and_(
                    Order.is_deleted == False,  # noqa
                    Order.service_type.in_([ServiceType.SOLAR, ServiceType.COMBINED]),
                    Order.created_at >= month_start,
                )
            )
        )
        solar_jobs = solar_result.scalar_one()

        tank_result = await self.db.execute(
            select(func.count(Order.id)).where(
                and_(
                    Order.is_deleted == False,  # noqa
                    Order.service_type.in_([ServiceType.TANK, ServiceType.COMBINED]),
                    Order.created_at >= month_start,
                )
            )
        )
        tank_jobs = tank_result.scalar_one()

        return DashboardStats(
            today_revenue=today_revenue,
            monthly_revenue=monthly_revenue,
            yearly_revenue=yearly_revenue,
            total_outstanding=total_outstanding,
            today_jobs=today_jobs,
            upcoming_jobs=upcoming_jobs,
            total_orders=total_orders,
            completed_orders=completed_orders,
            total_customers=total_customers,
            new_customers_this_month=new_customers_this_month,
            solar_jobs_this_month=solar_jobs,
            tank_jobs_this_month=tank_jobs,
        )

    async def _get_revenue_chart(self) -> list[RevenueDataPoint]:
        """Last 12 months revenue."""
        from datetime import timedelta

        now = datetime.now(timezone.utc)
        points = []

        for i in range(11, -1, -1):
            month = (now.month - i - 1) % 12 + 1
            year = now.year - ((now.month - i - 1) // 12)
            label = datetime(year, month, 1).strftime("%b %Y")

            result = await self.db.execute(
                select(func.coalesce(func.sum(Order.total_amount), 0)).where(
                    and_(
                        Order.is_deleted == False,  # noqa
                        Order.status == OrderStatus.COMPLETED,
                        func.extract("month", Order.completed_at) == month,
                        func.extract("year", Order.completed_at) == year,
                    )
                )
            )
            revenue = float(result.scalar_one())
            points.append(
                RevenueDataPoint(month=label, revenue=revenue, profit=revenue * 0.7)
            )

        return points

    async def _get_service_distribution(self) -> ServiceDistribution:
        async def count_type(st: ServiceType) -> int:
            r = await self.db.execute(
                select(func.count(Order.id)).where(
                    and_(Order.is_deleted == False, Order.service_type == st)  # noqa
                )
            )
            return r.scalar_one()

        return ServiceDistribution(
            solar=await count_type(ServiceType.SOLAR),
            tank=await count_type(ServiceType.TANK),
            combined=await count_type(ServiceType.COMBINED),
        )

    async def _get_upcoming_jobs(self) -> list[UpcomingJob]:
        orders = await self.order_repo.get_upcoming(limit=8)
        return [
            UpcomingJob(
                id=str(o.id),
                order_number=o.order_number,
                customer_name=o.customer.name if o.customer else "—",
                service_type=o.service_type.value,
                scheduled_date=o.scheduled_date.isoformat() if o.scheduled_date else "",
                scheduled_time=o.scheduled_time.strftime("%H:%M") if o.scheduled_time else None,
                status=o.status.value,
            )
            for o in orders
        ]

    async def _get_recent_activity(self) -> list[RecentActivity]:
        result = await self.db.execute(
            select(ActivityLog)
            .order_by(ActivityLog.created_at.desc())
            .limit(15)
        )
        logs = result.scalars().all()

        def fmt_time(dt: datetime) -> str:
            now = datetime.now(timezone.utc)
            if dt.tzinfo is None:
                from datetime import timezone as tz
                dt = dt.replace(tzinfo=tz.utc)
            diff = now - dt
            if diff.seconds < 60:
                return "just now"
            elif diff.seconds < 3600:
                return f"{diff.seconds // 60}m ago"
            elif diff.days < 1:
                return f"{diff.seconds // 3600}h ago"
            else:
                return f"{diff.days}d ago"

        return [
            RecentActivity(
                id=str(log.id),
                type=log.action,
                title=log.action.replace("_", " ").title(),
                description=str(log.details or ""),
                time=fmt_time(log.created_at),
                entity_type=log.entity_type,
                entity_id=log.entity_id,
            )
            for log in logs
        ]
