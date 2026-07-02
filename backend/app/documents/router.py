"""PrimeX Services CRM — Document Router."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, File, Query, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import CurrentUser
from app.documents.schemas import DocumentListResponse, DocumentResponse
from app.documents.service import DocumentService

router = APIRouter(tags=["Documents"])


@router.get("", response_model=DocumentListResponse)
async def list_documents(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: CurrentUser,
    entity_type: str | None = Query(
        None, description="Filter by entity type: customer | order | expense | amc"
    ),
    entity_id: str | None = Query(None, description="Filter by entity UUID"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
) -> DocumentListResponse:
    """List documents, optionally filtered by entity type and/or entity ID."""
    return await DocumentService(db).list(
        entity_type=entity_type,
        entity_id=entity_id,
        page=page,
        per_page=per_page,
    )


@router.post("/upload", response_model=DocumentResponse, status_code=201)
async def upload_document(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: CurrentUser,
    file: UploadFile = File(...),
    entity_type: str = Query(..., description="Entity type: customer | order | expense | amc"),
    entity_id: str = Query(..., description="UUID of the entity this document belongs to"),
) -> DocumentResponse:
    """
    Upload a file and attach it to a CRM entity.
    Accepts: jpg, jpeg, png, pdf, webp, docx, xlsx, csv.
    Max size governed by MAX_UPLOAD_SIZE_MB in settings.
    """
    return await DocumentService(db).upload_and_create(
        file=file,
        entity_type=entity_type,
        entity_id=entity_id,
        uploaded_by=str(current_user.id),
    )


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: CurrentUser,
) -> DocumentResponse:
    """Get a single document record by ID."""
    return await DocumentService(db).get_by_id(document_id)


@router.delete("/{document_id}", status_code=200)
async def delete_document(
    document_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: CurrentUser,
) -> dict:
    """Soft-delete a document record (file on disk is retained for audit)."""
    await DocumentService(db).delete(document_id)
    return {"message": "Document deleted successfully"}
