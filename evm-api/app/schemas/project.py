"""
Pydantic schemas for Project CRUD.
"""

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field


# ── Request Schemas ──────────────────────────────────────────────

class ProjectCreate(BaseModel):
    """Request body for POST /api/v1/projects."""
    name: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="Project name",
        examples=["Proyecto Alpha"],
    )
    description: str | None = Field(
        None,
        description="Optional project description",
    )


class ProjectUpdate(BaseModel):
    """Request body for PUT /api/v1/projects/{id}."""
    name: str | None = Field(
        None,
        min_length=1,
        max_length=255,
        description="Project name",
    )
    description: str | None = Field(
        None,
        description="Optional project description",
    )


# ── Response Schemas ─────────────────────────────────────────────

class ProjectResponse(BaseModel):
    """Response body for project CRUD endpoints."""
    id: UUID
    name: str
    description: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True, "json_encoders": {Decimal: float}}


class ProjectListResponse(BaseModel):
    """Wrapper for paginated project list responses."""
    items: list[ProjectResponse]
    total: int
    skip: int
    limit: int
