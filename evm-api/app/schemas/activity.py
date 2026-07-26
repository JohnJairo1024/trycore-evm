"""
Pydantic schemas for Activity CRUD.
"""

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field


# ── Request Schemas ──────────────────────────────────────────────

class ActivityCreate(BaseModel):
    """Request body for POST /api/v1/projects/{project_id}/activities."""
    name: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="Activity name",
        examples=["Diseño de UI"],
    )
    bac: Decimal = Field(
        ...,
        gt=0,
        decimal_places=2,
        description="Budget at Completion",
        examples=[20000.00],
    )
    planned_percentage: Decimal = Field(
        ...,
        ge=0,
        le=100,
        decimal_places=2,
        description="Planned progress percentage (0-100)",
        examples=[50.00],
    )
    actual_percentage: Decimal = Field(
        ...,
        ge=0,
        le=100,
        decimal_places=2,
        description="Actual progress percentage (0-100)",
        examples=[30.00],
    )
    actual_cost: Decimal = Field(
        ...,
        ge=0,
        decimal_places=2,
        description="Actual Cost incurred",
        examples=[7500.00],
    )


class ActivityUpdate(BaseModel):
    """Request body for PUT /api/v1/activities/{id}."""
    name: str | None = Field(
        None,
        min_length=1,
        max_length=255,
        description="Activity name",
    )
    bac: Decimal | None = Field(
        None,
        gt=0,
        decimal_places=2,
        description="Budget at Completion",
    )
    planned_percentage: Decimal | None = Field(
        None,
        ge=0,
        le=100,
        decimal_places=2,
        description="Planned progress percentage (0-100)",
    )
    actual_percentage: Decimal | None = Field(
        None,
        ge=0,
        le=100,
        decimal_places=2,
        description="Actual progress percentage (0-100)",
    )
    actual_cost: Decimal | None = Field(
        None,
        ge=0,
        decimal_places=2,
        description="Actual Cost incurred",
    )


# ── Response Schemas ─────────────────────────────────────────────

class ActivityResponse(BaseModel):
    """Response body for activity CRUD endpoints."""
    id: UUID
    project_id: UUID
    name: str
    bac: Decimal
    planned_percentage: Decimal
    actual_percentage: Decimal
    actual_cost: Decimal
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
