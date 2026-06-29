"""
PrimeX Services CRM — Generic Base Repository.

Provides type-safe CRUD operations reused across all feature repositories.
"""

from __future__ import annotations

import math
from typing import Any, Generic, Type, TypeVar
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.base_model import Base

ModelType = TypeVar("ModelType", bound=Base)


class BaseRepository(Generic[ModelType]):
    def __init__(self, model: Type[ModelType], session: AsyncSession) -> None:
        self.model = model
        self.session = session

    async def get_by_id(self, id: str | UUID) -> ModelType | None:
        return await self.session.get(self.model, str(id))

    async def get_all(
        self,
        skip: int = 0,
        limit: int = 50,
        filters: dict[str, Any] | None = None,
    ) -> tuple[list[ModelType], int]:
        """Return (items, total_count) with pagination."""
        query = select(self.model)

        if hasattr(self.model, "is_deleted"):
            query = query.where(self.model.is_deleted == False)  # noqa: E712

        if filters:
            for key, value in filters.items():
                if hasattr(self.model, key) and value is not None:
                    query = query.where(getattr(self.model, key) == value)

        # Count
        count_query = select(func.count()).select_from(query.subquery())
        total = (await self.session.execute(count_query)).scalar_one()

        # Paginate
        result = await self.session.execute(
            query.offset(skip).limit(limit).order_by(self.model.created_at.desc())
        )
        items = list(result.scalars().all())

        return items, total

    async def create(self, data: dict[str, Any]) -> ModelType:
        obj = self.model(**data)
        self.session.add(obj)
        await self.session.flush()
        await self.session.refresh(obj)
        return obj

    async def update(self, id: str | UUID, data: dict[str, Any]) -> ModelType | None:
        obj = await self.get_by_id(id)
        if obj is None:
            return None
        for key, value in data.items():
            if hasattr(obj, key):
                setattr(obj, key, value)
        await self.session.flush()
        await self.session.refresh(obj)
        return obj

    async def soft_delete(self, id: str | UUID) -> bool:
        obj = await self.get_by_id(id)
        if obj is None or not hasattr(obj, "is_deleted"):
            return False
        obj.is_deleted = True  # type: ignore
        await self.session.flush()
        return True

    @staticmethod
    def paginate(total: int, page: int, per_page: int) -> dict[str, int]:
        return {
            "total": total,
            "page": page,
            "per_page": per_page,
            "pages": math.ceil(total / per_page) if per_page else 0,
        }
