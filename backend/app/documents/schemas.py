"""PrimeX Services CRM — Document Pydantic Schemas."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class DocumentCreate(BaseModel):
    """Used internally after a file upload completes."""

    entity_type: str = Field(min_length=1, max_length=50)
    entity_id: str = Field(min_length=36, max_length=36, description="UUID of the linked entity")
    name: str = Field(min_length=1, max_length=255)
    file_url: str
    file_type: str = Field(max_length=100)
    file_size: int = Field(ge=0)


class DocumentResponse(BaseModel):
    id: str
    entity_type: str
    entity_id: str
    name: str
    file_url: str
    file_type: str
    file_size: int
    uploaded_by: str
    is_deleted: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DocumentListResponse(BaseModel):
    items: list[DocumentResponse]
    total: int
    page: int
    per_page: int
    pages: int
