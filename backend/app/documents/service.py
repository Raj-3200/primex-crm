"""PrimeX Services CRM — Document Service."""

from __future__ import annotations

import logging
import uuid
from pathlib import Path

import aiofiles
from fastapi import HTTPException, UploadFile

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import NotFoundError, ValidationError
from app.documents.models import Document
from app.documents.repository import DocumentRepository
from app.documents.schemas import DocumentCreate, DocumentListResponse, DocumentResponse

logger = logging.getLogger("primex.documents")

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".pdf", ".webp", ".docx", ".xlsx", ".csv"}
CHUNK_SIZE = 1024 * 1024  # 1 MB

VALID_ENTITY_TYPES = {"customer", "order", "expense", "amc"}


class DocumentService:
    def __init__(self, db: AsyncSession) -> None:
        self.repo = DocumentRepository(db)
        self.db = db

    async def upload_and_create(
        self,
        file: UploadFile,
        entity_type: str,
        entity_id: str,
        uploaded_by: str,
    ) -> DocumentResponse:
        """Save a file to disk and persist a Document record."""
        if entity_type not in VALID_ENTITY_TYPES:
            raise ValidationError(
                f"Invalid entity_type '{entity_type}'. Valid: {sorted(VALID_ENTITY_TYPES)}"
            )

        if not file.filename:
            raise HTTPException(status_code=400, detail="No filename provided")

        ext = Path(file.filename).suffix.lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"File type '{ext}' is not allowed. Allowed: {sorted(ALLOWED_EXTENSIONS)}",
            )

        safe_name = f"{uuid.uuid4()}{ext}"
        upload_dir = Path(settings.upload_dir)
        upload_dir.mkdir(parents=True, exist_ok=True)
        file_path = upload_dir / safe_name

        total_size = 0
        async with aiofiles.open(file_path, "wb") as out:
            while chunk := await file.read(CHUNK_SIZE):
                total_size += len(chunk)
                if total_size > settings.max_upload_size_bytes:
                    await out.close()
                    file_path.unlink(missing_ok=True)
                    raise HTTPException(status_code=413, detail="File exceeds maximum allowed size")
                await out.write(chunk)

        file_url = f"/uploads/{safe_name}"
        payload: dict = {
            "entity_type": entity_type,
            "entity_id": entity_id,
            "name": file.filename,
            "file_url": file_url,
            "file_type": file.content_type or "application/octet-stream",
            "file_size": total_size,
            "uploaded_by": uploaded_by,
        }

        doc = await self.repo.create(payload)
        logger.info(
            "Document uploaded: %s entity=%s:%s by=%s", doc.id, entity_type, entity_id, uploaded_by
        )
        return self._to_response(doc)

    async def get_by_id(self, document_id: str) -> DocumentResponse:
        doc = await self.repo.get_document(document_id)
        if not doc:
            raise NotFoundError("Document", document_id)
        return self._to_response(doc)

    async def list(
        self,
        entity_type: str | None = None,
        entity_id: str | None = None,
        page: int = 1,
        per_page: int = 20,
    ) -> DocumentListResponse:
        if entity_type and entity_type not in VALID_ENTITY_TYPES:
            raise ValidationError(
                f"Invalid entity_type '{entity_type}'. Valid: {sorted(VALID_ENTITY_TYPES)}"
            )

        docs, total = await self.repo.list_documents(
            entity_type=entity_type,
            entity_id=entity_id,
            page=page,
            per_page=per_page,
        )
        pagination = self.repo.paginate(total, page, per_page)
        return DocumentListResponse(
            items=[self._to_response(d) for d in docs],
            **pagination,
        )

    async def delete(self, document_id: str) -> None:
        doc = await self.repo.get_document(document_id)
        if not doc:
            raise NotFoundError("Document", document_id)
        await self.repo.soft_delete(document_id)
        logger.info("Document soft-deleted: %s", document_id)

    @staticmethod
    def _to_response(doc: Document) -> DocumentResponse:
        return DocumentResponse(
            id=str(doc.id),
            entity_type=doc.entity_type,
            entity_id=doc.entity_id,
            name=doc.name,
            file_url=doc.file_url,
            file_type=doc.file_type,
            file_size=doc.file_size,
            uploaded_by=str(doc.uploaded_by),
            is_deleted=doc.is_deleted,
            created_at=doc.created_at,
            updated_at=doc.updated_at,
        )
