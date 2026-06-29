"""PrimeX Services CRM — Customer Pydantic schemas."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, EmailStr, Field


class CustomerCreate(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    phone: str = Field(min_length=7, max_length=20)
    alternate_phone: str | None = Field(default=None, max_length=20)
    email: EmailStr | None = None
    address: str = Field(min_length=5)
    latitude: float | None = None
    longitude: float | None = None
    maps_url: str | None = None
    gst_number: str | None = Field(default=None, max_length=20)
    property_type: str
    lead_source: str = "OTHER"
    notes: str | None = None


class CustomerUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=255)
    phone: str | None = Field(default=None, min_length=7, max_length=20)
    alternate_phone: str | None = None
    email: EmailStr | None = None
    address: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    maps_url: str | None = None
    gst_number: str | None = None
    property_type: str | None = None
    lead_source: str | None = None
    notes: str | None = None


class CustomerResponse(BaseModel):
    id: str
    customer_id: str
    name: str
    phone: str
    alternate_phone: str | None
    email: str | None
    address: str
    latitude: float | None
    longitude: float | None
    maps_url: str | None
    gst_number: str | None
    property_type: str
    lead_source: str
    notes: str | None
    created_at: datetime
    updated_at: datetime
    # Computed fields
    total_orders: int = 0
    total_spent: float = 0.0

    model_config = {"from_attributes": True}


class CustomerListResponse(BaseModel):
    items: list[CustomerResponse]
    total: int
    page: int
    per_page: int
    pages: int


class TimelineEvent(BaseModel):
    id: str
    type: str
    title: str
    description: str | None
    date: datetime
    metadata: dict[str, Any] = {}
