"""
PrimeX CRM — Analytics Router
Provides rich analytics endpoints for Solar, Tanks, AMC, Calendar,
Employees, Payments, Invoices, Quotations, Contracts, Expenses,
Reports, and Notifications.
"""

from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user

router = APIRouter(tags=["Analytics"])


# ─── helpers ──────────────────────────────────────────────────────────────────

def _to_float(val: Any) -> float:
    """Safely coerce Decimal / None to float."""
    if val is None:
        return 0.0
    return float(val) if isinstance(val, Decimal) else float(val)


def _to_str(val: Any) -> str | None:
    """Safely convert UUID / date / datetime to string."""
    if val is None:
        return None
    return str(val)


def _row_to_dict(row: Any) -> dict:
    """Convert a SQLAlchemy Row (named-tuple-like) to a plain dict,
    serialising UUIDs, dates, datetimes and Decimals."""
    result: dict = {}
    for key in row._fields:
        val = getattr(row, key)
        if isinstance(val, Decimal):
            result[key] = float(val)
        elif hasattr(val, "isoformat"):          # date / datetime
            result[key] = val.isoformat()
        elif val is not None and not isinstance(val, (str, int, float, bool)):
            result[key] = str(val)               # UUID etc.
        else:
            result[key] = val
    return result


# ─── GET /solar ───────────────────────────────────────────────────────────────

@router.get("/solar")
async def get_solar_analytics(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Solar cleaning jobs with details and stats."""

    # Main query
    sql = text("""
        SELECT o.id, o.order_number, o.service_type, o.status,
               o.subtotal, o.discount, o.tax_amount, o.total_amount,
               o.scheduled_date, o.scheduled_time, o.notes,
               o.created_at, o.completed_at,
               c.name          AS customer_name,
               c.customer_id   AS customer_code,
               c.phone         AS customer_phone,
               s.panel_count, s.capacity_kw, s.roof_type,
               s.panel_type, s.remarks
        FROM orders o
        JOIN customers c ON c.id = o.customer_id
        LEFT JOIN solar_cleaning_details s ON s.order_id = o.id
        WHERE o.service_type = 'SOLAR' AND o.is_deleted = false
        ORDER BY o.created_at DESC
    """)
    result = await db.execute(sql)
    rows = result.fetchall()
    orders = [_row_to_dict(r) for r in rows]

    # Stats
    stats_sql = text("""
        SELECT
            COUNT(*)                                                      AS total,
            COUNT(CASE WHEN status = 'COMPLETED'  THEN 1 END)            AS completed,
            COUNT(CASE WHEN status = 'PENDING'    THEN 1 END)            AS pending,
            COALESCE(SUM(CASE WHEN status = 'COMPLETED' THEN total_amount END), 0) AS revenue
        FROM orders
        WHERE service_type = 'SOLAR' AND is_deleted = false
    """)
    stats_result = await db.execute(stats_sql)
    stats_row = stats_result.fetchone()

    stats = {
        "total":     int(stats_row.total     or 0),
        "completed": int(stats_row.completed or 0),
        "pending":   int(stats_row.pending   or 0),
        "revenue":   _to_float(stats_row.revenue),
    }

    return {"orders": orders, "stats": stats}


# ─── GET /tanks ───────────────────────────────────────────────────────────────

@router.get("/tanks")
async def get_tanks_analytics(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Tank cleaning jobs with details and stats."""

    sql = text("""
        SELECT o.id, o.order_number, o.service_type, o.status,
               o.subtotal, o.discount, o.tax_amount, o.total_amount,
               o.scheduled_date, o.scheduled_time, o.notes,
               o.created_at, o.completed_at,
               c.name          AS customer_name,
               c.customer_id   AS customer_code,
               c.phone         AS customer_phone,
               t.tank_type, t.capacity_liters, t.number_of_tanks,
               t.chemical_used, t.remarks
        FROM orders o
        JOIN customers c ON c.id = o.customer_id
        LEFT JOIN tank_cleaning_details t ON t.order_id = o.id
        WHERE o.service_type = 'TANK' AND o.is_deleted = false
        ORDER BY o.created_at DESC
    """)
    result = await db.execute(sql)
    rows = result.fetchall()
    orders = [_row_to_dict(r) for r in rows]

    stats_sql = text("""
        SELECT
            COUNT(*)                                                      AS total,
            COUNT(CASE WHEN status = 'COMPLETED'  THEN 1 END)            AS completed,
            COUNT(CASE WHEN status = 'PENDING'    THEN 1 END)            AS pending,
            COALESCE(SUM(CASE WHEN status = 'COMPLETED' THEN total_amount END), 0) AS revenue
        FROM orders
        WHERE service_type = 'TANK' AND is_deleted = false
    """)
    stats_result = await db.execute(stats_sql)
    stats_row = stats_result.fetchone()

    stats = {
        "total":     int(stats_row.total     or 0),
        "completed": int(stats_row.completed or 0),
        "pending":   int(stats_row.pending   or 0),
        "revenue":   _to_float(stats_row.revenue),
    }

    return {"orders": orders, "stats": stats}


# ─── GET /amc ─────────────────────────────────────────────────────────────────

@router.get("/amc")
async def get_amc_analytics(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """AMC (Annual Maintenance Contract / COMBINED) jobs with details and stats."""

    sql = text("""
        SELECT o.id, o.order_number, o.service_type, o.status,
               o.subtotal, o.discount, o.tax_amount, o.total_amount,
               o.scheduled_date, o.scheduled_time, o.notes,
               o.created_at, o.completed_at,
               c.name          AS customer_name,
               c.customer_id   AS customer_code,
               c.phone         AS customer_phone
        FROM orders o
        JOIN customers c ON c.id = o.customer_id
        WHERE o.service_type = 'COMBINED' AND o.is_deleted = false
        ORDER BY o.created_at DESC
    """)
    result = await db.execute(sql)
    rows = result.fetchall()
    orders = [_row_to_dict(r) for r in rows]

    stats_sql = text("""
        SELECT
            COUNT(*)                                                         AS total,
            COUNT(CASE WHEN status = 'COMPLETED'   THEN 1 END)              AS completed,
            COUNT(CASE WHEN status = 'PENDING'     THEN 1 END)              AS pending,
            COALESCE(SUM(CASE WHEN status = 'COMPLETED' THEN total_amount END), 0) AS revenue,
            COUNT(CASE WHEN status IN ('PENDING','SCHEDULED','IN_PROGRESS') THEN 1 END) AS active_contracts,
            COUNT(CASE WHEN scheduled_date BETWEEN CURRENT_DATE
                              AND CURRENT_DATE + INTERVAL '30 days' THEN 1 END) AS expiring_soon
        FROM orders
        WHERE service_type = 'COMBINED' AND is_deleted = false
    """)
    stats_result = await db.execute(stats_sql)
    stats_row = stats_result.fetchone()

    stats = {
        "total":            int(stats_row.total            or 0),
        "completed":        int(stats_row.completed        or 0),
        "pending":          int(stats_row.pending          or 0),
        "revenue":          _to_float(stats_row.revenue),
        "active_contracts": int(stats_row.active_contracts or 0),
        "expiring_soon":    int(stats_row.expiring_soon    or 0),
    }

    return {"orders": orders, "stats": stats}


# ─── GET /calendar ────────────────────────────────────────────────────────────

@router.get("/calendar")
async def get_calendar(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Scheduled (non-cancelled/completed) jobs for calendar view."""

    sql = text("""
        SELECT o.id, o.order_number, o.service_type, o.status,
               o.scheduled_date, o.scheduled_time, o.total_amount,
               c.name AS customer_name
        FROM orders o
        JOIN customers c ON c.id = o.customer_id
        WHERE o.scheduled_date IS NOT NULL
          AND o.is_deleted = false
          AND o.status NOT IN ('CANCELLED', 'COMPLETED')
        ORDER BY o.scheduled_date ASC, o.scheduled_time ASC NULLS LAST
    """)
    result = await db.execute(sql)
    rows = result.fetchall()
    events = [_row_to_dict(r) for r in rows]

    return {"events": events}


# ─── GET /employees ───────────────────────────────────────────────────────────

@router.get("/employees")
async def get_employees(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Staff list with role-based stats."""

    sql = text("""
        SELECT id, email, full_name, phone, role, is_active, created_at
        FROM users
        WHERE is_deleted = false
        ORDER BY created_at DESC
    """)
    result = await db.execute(sql)
    rows = result.fetchall()
    employees = [_row_to_dict(r) for r in rows]

    stats_sql = text("""
        SELECT
            COUNT(*)                                           AS total,
            COUNT(CASE WHEN role = 'ADMIN'      THEN 1 END)  AS admins,
            COUNT(CASE WHEN role = 'MANAGER'    THEN 1 END)  AS managers,
            COUNT(CASE WHEN role = 'TECHNICIAN' THEN 1 END)  AS technicians
        FROM users
        WHERE is_deleted = false
    """)
    stats_result = await db.execute(stats_sql)
    stats_row = stats_result.fetchone()

    stats = {
        "total":       int(stats_row.total       or 0),
        "admins":      int(stats_row.admins      or 0),
        "managers":    int(stats_row.managers    or 0),
        "technicians": int(stats_row.technicians or 0),
    }

    return {"employees": employees, "stats": stats}


# ─── GET /payments ────────────────────────────────────────────────────────────

@router.get("/payments")
async def get_payments(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Completed orders treated as received payments."""

    sql = text("""
        SELECT o.id, o.order_number, o.service_type, o.status,
               o.total_amount, o.completed_at, o.created_at,
               c.name        AS customer_name,
               c.customer_id AS customer_code
        FROM orders o
        JOIN customers c ON c.id = o.customer_id
        WHERE o.status = 'COMPLETED' AND o.is_deleted = false
        ORDER BY o.completed_at DESC NULLS LAST
    """)
    result = await db.execute(sql)
    rows = result.fetchall()
    payments = [_row_to_dict(r) for r in rows]

    stats_sql = text("""
        SELECT
            COALESCE(SUM(total_amount), 0)                                AS total_collected,
            COALESCE(SUM(CASE
                WHEN DATE_TRUNC('month', completed_at) = DATE_TRUNC('month', NOW())
                THEN total_amount END), 0)                                AS this_month,
            COUNT(*)                                                      AS total_count
        FROM orders
        WHERE status = 'COMPLETED' AND is_deleted = false
    """)
    stats_result = await db.execute(stats_sql)
    stats_row = stats_result.fetchone()

    stats = {
        "total_collected": _to_float(stats_row.total_collected),
        "this_month":      _to_float(stats_row.this_month),
        "total_count":     int(stats_row.total_count or 0),
    }

    return {"payments": payments, "stats": stats}


# ─── GET /invoices ────────────────────────────────────────────────────────────

@router.get("/invoices")
async def get_invoices(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """All invoiced orders (total_amount > 0)."""

    sql = text("""
        SELECT o.id, o.order_number, o.service_type, o.status,
               o.subtotal, o.discount, o.tax_amount, o.total_amount,
               o.created_at,
               c.name        AS customer_name,
               c.customer_id AS customer_code,
               c.email, c.phone
        FROM orders o
        JOIN customers c ON c.id = o.customer_id
        WHERE o.is_deleted = false AND o.total_amount > 0
        ORDER BY o.created_at DESC
    """)
    result = await db.execute(sql)
    rows = result.fetchall()
    invoices = [_row_to_dict(r) for r in rows]

    stats_sql = text("""
        SELECT
            COALESCE(SUM(total_amount), 0)                                        AS total_amount,
            COALESCE(SUM(CASE WHEN status = 'COMPLETED' THEN total_amount END), 0) AS paid_amount,
            COALESCE(SUM(CASE WHEN status != 'COMPLETED' THEN total_amount END), 0) AS pending_amount,
            COUNT(*)                                                               AS total_count
        FROM orders
        WHERE is_deleted = false AND total_amount > 0
    """)
    stats_result = await db.execute(stats_sql)
    stats_row = stats_result.fetchone()

    stats = {
        "total_amount":   _to_float(stats_row.total_amount),
        "paid_amount":    _to_float(stats_row.paid_amount),
        "pending_amount": _to_float(stats_row.pending_amount),
        "total_count":    int(stats_row.total_count or 0),
    }

    return {"invoices": invoices, "stats": stats}


# ─── GET /quotations ──────────────────────────────────────────────────────────

@router.get("/quotations")
async def get_quotations(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Pending / Scheduled orders as quotations."""

    sql = text("""
        SELECT o.id, o.order_number, o.service_type, o.status,
               o.total_amount, o.created_at, o.scheduled_date,
               c.name        AS customer_name,
               c.customer_id AS customer_code,
               c.phone
        FROM orders o
        JOIN customers c ON c.id = o.customer_id
        WHERE o.status IN ('PENDING', 'SCHEDULED') AND o.is_deleted = false
        ORDER BY o.created_at DESC
    """)
    result = await db.execute(sql)
    rows = result.fetchall()
    quotations = [_row_to_dict(r) for r in rows]

    stats_sql = text("""
        SELECT
            COUNT(*)                                              AS total,
            COUNT(CASE WHEN status = 'PENDING'   THEN 1 END)    AS pending,
            COUNT(CASE WHEN status = 'SCHEDULED' THEN 1 END)    AS scheduled,
            COALESCE(SUM(total_amount), 0)                       AS total_value
        FROM orders
        WHERE status IN ('PENDING', 'SCHEDULED') AND is_deleted = false
    """)
    stats_result = await db.execute(stats_sql)
    stats_row = stats_result.fetchone()

    stats = {
        "total":       int(stats_row.total     or 0),
        "pending":     int(stats_row.pending   or 0),
        "scheduled":   int(stats_row.scheduled or 0),
        "total_value": _to_float(stats_row.total_value),
    }

    return {"quotations": quotations, "stats": stats}


# ─── GET /contracts ───────────────────────────────────────────────────────────

@router.get("/contracts")
async def get_contracts(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """AMC contracts (COMBINED service type)."""

    sql = text("""
        SELECT o.id, o.order_number, o.service_type, o.status,
               o.total_amount, o.created_at, o.scheduled_date, o.notes,
               c.name        AS customer_name,
               c.customer_id AS customer_code,
               c.phone, c.address
        FROM orders o
        JOIN customers c ON c.id = o.customer_id
        WHERE o.service_type = 'COMBINED' AND o.is_deleted = false
        ORDER BY o.created_at DESC
    """)
    result = await db.execute(sql)
    rows = result.fetchall()
    contracts = [_row_to_dict(r) for r in rows]

    stats_sql = text("""
        SELECT
            COUNT(*)                                                                AS total,
            COUNT(CASE WHEN status IN ('PENDING','SCHEDULED','IN_PROGRESS') THEN 1 END) AS active,
            COUNT(CASE WHEN status IN ('COMPLETED','CANCELLED')             THEN 1 END) AS expired,
            COALESCE(SUM(total_amount), 0)                                          AS total_value
        FROM orders
        WHERE service_type = 'COMBINED' AND is_deleted = false
    """)
    stats_result = await db.execute(stats_sql)
    stats_row = stats_result.fetchone()

    stats = {
        "total":       int(stats_row.total   or 0),
        "active":      int(stats_row.active  or 0),
        "expired":     int(stats_row.expired or 0),
        "total_value": _to_float(stats_row.total_value),
    }

    return {"contracts": contracts, "stats": stats}


# ─── GET /expenses ────────────────────────────────────────────────────────────

@router.get("/expenses")
async def get_expenses(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Revenue / cost analytics with monthly and service-type breakdowns."""

    # Overall summary
    summary_sql = text("""
        SELECT
            COALESCE(SUM(total_amount), 0)                                AS total_revenue,
            COALESCE(SUM(discount),     0)                                AS total_discounts,
            COALESCE(SUM(tax_amount),   0)                                AS total_tax,
            COUNT(*)                                                       AS total_orders,
            COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END)              AS completed_orders
        FROM orders
        WHERE is_deleted = false
    """)
    summary_result = await db.execute(summary_sql)
    summary_row = summary_result.fetchone()

    summary = {
        "total_revenue":     _to_float(summary_row.total_revenue),
        "total_discounts":   _to_float(summary_row.total_discounts),
        "total_tax":         _to_float(summary_row.total_tax),
        "total_orders":      int(summary_row.total_orders      or 0),
        "completed_orders":  int(summary_row.completed_orders  or 0),
    }

    # Monthly breakdown — last 6 months
    monthly_sql = text("""
        SELECT
            TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') AS month,
            COALESCE(SUM(total_amount), 0)                       AS revenue,
            COUNT(*)                                             AS order_count
        FROM orders
        WHERE is_deleted = false
          AND created_at >= NOW() - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY DATE_TRUNC('month', created_at) ASC
    """)
    monthly_result = await db.execute(monthly_sql)
    monthly_rows = monthly_result.fetchall()
    monthly = [
        {
            "month":       r.month,
            "revenue":     _to_float(r.revenue),
            "order_count": int(r.order_count or 0),
        }
        for r in monthly_rows
    ]

    # By service type
    service_sql = text("""
        SELECT
            service_type,
            COALESCE(SUM(total_amount), 0) AS revenue,
            COUNT(*)                        AS order_count
        FROM orders
        WHERE is_deleted = false
        GROUP BY service_type
        ORDER BY revenue DESC
    """)
    service_result = await db.execute(service_sql)
    service_rows = service_result.fetchall()
    by_service = [
        {
            "service_type": r.service_type,
            "revenue":      _to_float(r.revenue),
            "order_count":  int(r.order_count or 0),
        }
        for r in service_rows
    ]

    return {"summary": summary, "monthly": monthly, "by_service": by_service}


# ─── GET /reports ─────────────────────────────────────────────────────────────

@router.get("/reports")
async def get_reports(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Full analytics: monthly revenue (12 m), top customers, service & status breakdown."""

    # Monthly revenue — last 12 months
    monthly_sql = text("""
        SELECT
            TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') AS month,
            COALESCE(SUM(total_amount), 0)                       AS revenue,
            COUNT(*)                                             AS order_count
        FROM orders
        WHERE is_deleted = false
          AND created_at >= NOW() - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY DATE_TRUNC('month', created_at) ASC
    """)
    monthly_result = await db.execute(monthly_sql)
    monthly_rows = monthly_result.fetchall()
    monthly_revenue = [
        {
            "month":       r.month,
            "revenue":     _to_float(r.revenue),
            "order_count": int(r.order_count or 0),
        }
        for r in monthly_rows
    ]

    # Top 5 customers by revenue
    top_customers_sql = text("""
        SELECT
            c.id, c.name, c.customer_id AS customer_code,
            COALESCE(SUM(o.total_amount), 0) AS total_revenue,
            COUNT(o.id)                       AS total_orders
        FROM customers c
        JOIN orders o ON o.customer_id = c.id
        WHERE o.is_deleted = false AND c.is_deleted = false
        GROUP BY c.id, c.name, c.customer_id
        ORDER BY total_revenue DESC
        LIMIT 5
    """)
    top_customers_result = await db.execute(top_customers_sql)
    top_customers_rows = top_customers_result.fetchall()
    top_customers = [
        {
            "id":            str(r.id),
            "name":          r.name,
            "customer_code": r.customer_code,
            "total_revenue": _to_float(r.total_revenue),
            "total_orders":  int(r.total_orders or 0),
        }
        for r in top_customers_rows
    ]

    # Service type distribution
    service_sql = text("""
        SELECT
            service_type,
            COUNT(*)                        AS count,
            COALESCE(SUM(total_amount), 0) AS revenue
        FROM orders
        WHERE is_deleted = false
        GROUP BY service_type
    """)
    service_result = await db.execute(service_sql)
    service_rows = service_result.fetchall()
    service_distribution = {
        r.service_type: {
            "count":   int(r.count   or 0),
            "revenue": _to_float(r.revenue),
        }
        for r in service_rows
    }

    # Status breakdown
    status_sql = text("""
        SELECT
            status,
            COUNT(*)                        AS count,
            COALESCE(SUM(total_amount), 0) AS revenue
        FROM orders
        WHERE is_deleted = false
        GROUP BY status
    """)
    status_result = await db.execute(status_sql)
    status_rows = status_result.fetchall()
    status_breakdown = {
        r.status: {
            "count":   int(r.count   or 0),
            "revenue": _to_float(r.revenue),
        }
        for r in status_rows
    }

    return {
        "monthly_revenue":     monthly_revenue,
        "top_customers":       top_customers,
        "service_distribution": service_distribution,
        "status_breakdown":    status_breakdown,
    }


# ─── GET /notifications ───────────────────────────────────────────────────────

@router.get("/notifications")
async def get_notifications(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Fetch the 50 most recent notifications with unread count."""

    sql = text("""
        SELECT id, user_id, type, title, message,
               is_read, entity_type, entity_id, created_at
        FROM notifications
        ORDER BY created_at DESC
        LIMIT 50
    """)
    result = await db.execute(sql)
    rows = result.fetchall()
    notifications = [_row_to_dict(r) for r in rows]

    unread_sql = text("""
        SELECT COUNT(*) AS unread_count FROM notifications WHERE is_read = false
    """)
    unread_result = await db.execute(unread_sql)
    unread_row = unread_result.fetchone()
    unread_count = int(unread_row.unread_count or 0)

    return {"notifications": notifications, "unread_count": unread_count}


# ─── POST /notifications/{id}/read ────────────────────────────────────────────

@router.post("/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Mark a single notification as read."""

    sql = text("""
        UPDATE notifications
        SET is_read = true
        WHERE id = :id
    """)
    await db.execute(sql, {"id": notification_id})
    await db.commit()

    return {"success": True, "notification_id": notification_id}
