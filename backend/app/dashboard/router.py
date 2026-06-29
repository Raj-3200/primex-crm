"""PrimeX Services CRM — Dashboard Router."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import CurrentUser
from app.dashboard.schemas import DashboardResponse
from app.dashboard.service import DashboardService

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("", response_model=DashboardResponse)
async def get_dashboard(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: CurrentUser,
) -> DashboardResponse:
    """
    Get all dashboard data in a single request:
    stats, revenue chart, service distribution, upcoming jobs, recent activity.
    All values are computed from real database records — never dummy data.
    """
    return await DashboardService(db).get_dashboard()
