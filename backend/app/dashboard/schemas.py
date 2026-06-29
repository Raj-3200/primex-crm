"""PrimeX Services CRM — Dashboard Pydantic schemas."""

from __future__ import annotations

from pydantic import BaseModel


class DashboardStats(BaseModel):
    # Revenue
    today_revenue: float
    monthly_revenue: float
    yearly_revenue: float
    total_outstanding: float

    # Jobs
    today_jobs: int
    upcoming_jobs: int
    total_orders: int
    completed_orders: int

    # Customers
    total_customers: int
    new_customers_this_month: int

    # Services
    solar_jobs_this_month: int
    tank_jobs_this_month: int


class RevenueDataPoint(BaseModel):
    month: str
    revenue: float
    expenses: float = 0.0
    profit: float = 0.0


class ServiceDistribution(BaseModel):
    solar: int
    tank: int
    combined: int


class UpcomingJob(BaseModel):
    id: str
    order_number: str
    customer_name: str
    service_type: str
    scheduled_date: str
    scheduled_time: str | None
    status: str


class RecentActivity(BaseModel):
    id: str
    type: str
    title: str
    description: str
    time: str
    entity_type: str
    entity_id: str


class DashboardResponse(BaseModel):
    stats: DashboardStats
    revenue_chart: list[RevenueDataPoint]
    service_distribution: ServiceDistribution
    upcoming_jobs: list[UpcomingJob]
    recent_activity: list[RecentActivity]
