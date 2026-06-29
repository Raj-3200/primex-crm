"""PrimeX Services CRM — Order Pydantic schemas."""

from __future__ import annotations

from datetime import date, datetime, time

from pydantic import BaseModel, Field


class SolarDetailCreate(BaseModel):
    panel_count: int = Field(gt=0)
    capacity_kw: float = Field(gt=0)
    roof_type: str
    panel_type: str
    remarks: str | None = None


class SolarDetailUpdate(BaseModel):
    panel_count: int | None = Field(default=None, gt=0)
    capacity_kw: float | None = Field(default=None, gt=0)
    roof_type: str | None = None
    panel_type: str | None = None
    remarks: str | None = None


class SolarDetailResponse(BaseModel):
    id: str
    panel_count: int
    capacity_kw: float
    roof_type: str
    panel_type: str
    before_photos: list[str]
    after_photos: list[str]
    remarks: str | None

    model_config = {"from_attributes": True}


class TankDetailCreate(BaseModel):
    tank_type: str
    capacity_liters: int = Field(gt=0)
    number_of_tanks: int = Field(gt=0, default=1)
    chemical_used: str | None = None
    remarks: str | None = None


class TankDetailUpdate(BaseModel):
    tank_type: str | None = None
    capacity_liters: int | None = Field(default=None, gt=0)
    number_of_tanks: int | None = Field(default=None, gt=0)
    chemical_used: str | None = None
    remarks: str | None = None


class TankDetailResponse(BaseModel):
    id: str
    tank_type: str
    capacity_liters: int
    number_of_tanks: int
    before_photos: list[str]
    after_photos: list[str]
    chemical_used: str | None
    remarks: str | None

    model_config = {"from_attributes": True}


class OrderCreate(BaseModel):
    customer_id: str
    service_type: str
    scheduled_date: date | None = None
    scheduled_time: time | None = None
    subtotal: float = Field(ge=0)
    discount: float = Field(ge=0, default=0)
    tax_rate: float = Field(ge=0, le=100, default=0)
    notes: str | None = None
    assigned_to: str | None = None
    solar_detail: SolarDetailCreate | None = None
    tank_detail: TankDetailCreate | None = None


class OrderUpdate(BaseModel):
    scheduled_date: date | None = None
    scheduled_time: time | None = None
    subtotal: float | None = Field(default=None, ge=0)
    discount: float | None = Field(default=None, ge=0)
    tax_rate: float | None = Field(default=None, ge=0, le=100)
    notes: str | None = None
    assigned_to: str | None = None
    solar_detail: SolarDetailUpdate | None = None
    tank_detail: TankDetailUpdate | None = None


class OrderStatusUpdate(BaseModel):
    status: str
    notes: str | None = None


class OrderResponse(BaseModel):
    id: str
    order_number: str
    customer_id: str
    customer_name: str = ""
    service_type: str
    status: str
    scheduled_date: date | None
    scheduled_time: time | None
    completed_at: datetime | None
    subtotal: float
    discount: float
    tax_rate: float
    tax_amount: float
    total_amount: float
    notes: str | None
    assigned_to: str | None
    created_at: datetime
    updated_at: datetime
    solar_detail: SolarDetailResponse | None
    tank_detail: TankDetailResponse | None

    model_config = {"from_attributes": True}


class OrderListResponse(BaseModel):
    items: list[OrderResponse]
    total: int
    page: int
    per_page: int
    pages: int
