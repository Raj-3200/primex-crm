"""PrimeX Services CRM — Document Repository."""

from __future__ import annotations

import logging

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.repository import BaseRepository
from app.documents.models import Document

logger = logging.getLogger("primex.documents")


class DocumentRepository(BaseRepository[Document]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(Document, session)

    async def get_document(self, document_id: str) -> Document | None:
        """Fetch a single non-deleted document."""
        result = await self.session.execute(
            select(Document).where(
                Document.id == document_id,
                Document.is_deleted == False,  # noqa: E712
            )
        )
        return result.scalar_one_or_none()

    async def list_documents(
        self,
        entity_type: str | None = None,
        entity_id: str | None = None,
        page: int = 1,
        per_page: int = 20,
    ) -> tuple[list[Document], int]:
        """List documents filtered by entity type and/or entity ID."""
        stmt = select(Document).where(Document.is_deleted == False)  # noqa: E712

        if entity_type:
            stmt = stmt.where(Document.entity_type == entity_type)
        if entity_id:
            stmt = stmt.where(Document.entity_id == entity_id)

        count_q = select(func.count()).select_from(stmt.subquery())
        total = (await self.session.execute(count_q)).scalar_one()

        stmt = stmt.order_by(Document.created_at.desc())
        stmt = stmt.offset((page - 1) * per_page).limit(per_page)

        result = await self.session.execute(stmt)
        return list(result.scalars().all()), total
