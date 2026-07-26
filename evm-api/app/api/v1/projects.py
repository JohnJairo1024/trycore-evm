"""
API v1 — Project endpoints.

Controller layer: receives HTTP requests, delegates to services, returns responses.
Kept thin per ADR-008.
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.project import (
    ProjectCreate,
    ProjectListResponse,
    ProjectResponse,
    ProjectUpdate,
)
from app.schemas.evm import ProjectEVMResponse
from app.services.project_service import ProjectService
from app.services.activity_service import ActivityService
from app.services.evm_calculator import calculate_project_evm

router = APIRouter(prefix="/projects", tags=["Projects"])


# ── CRUD Endpoints ───────────────────────────────────────────────

@router.post("", response_model=ProjectResponse, status_code=201)
async def create_project(
    data: ProjectCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a new project."""
    service = ProjectService(db)
    project = await service.create(data)
    return project


@router.get("", response_model=ProjectListResponse)
async def list_projects(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=500, description="Max records to return"),
    db: AsyncSession = Depends(get_db),
):
    """List all projects with pagination."""
    service = ProjectService(db)
    items, total = await service.list_all(skip=skip, limit=limit)
    return ProjectListResponse(
        items=list(items),
        total=total,
        skip=skip,
        limit=limit,
    )


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get a single project by ID."""
    service = ProjectService(db)
    project = await service.get_by_id(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: uuid.UUID,
    data: ProjectUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update an existing project."""
    service = ProjectService(db)
    project = await service.update(project_id, data)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.delete("/{project_id}", status_code=204)
async def delete_project(
    project_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Delete a project and all its activities (CASCADE)."""
    service = ProjectService(db)
    deleted = await service.delete(project_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Project not found")
    return None


# ── EVM Endpoint ─────────────────────────────────────────────────

@router.get("/{project_id}/evm", response_model=ProjectEVMResponse)
async def get_project_evm(
    project_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    Get consolidated EVM indicators for a project.

    ADR-001: All EVM calculations happen in the backend.
    ADR-002: Indicators are calculated in real-time, not stored.
    """
    # Verify project exists
    project_service = ProjectService(db)
    project = await project_service.get_by_id(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Get all activities
    activity_service = ActivityService(db)
    activities = await activity_service.list_by_project(project_id)

    # Calculate EVM indicators
    return calculate_project_evm(
        project_id=project.id,
        project_name=project.name,
        activities=activities,
    )
