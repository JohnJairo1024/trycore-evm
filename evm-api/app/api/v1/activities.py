"""
API v1 — Activity endpoints.

Controller layer: receives HTTP requests, delegates to services, returns responses.
Kept thin per ADR-008.
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.activity import (
    ActivityCreate,
    ActivityResponse,
    ActivityUpdate,
)
from app.schemas.evm import ActivityEVMResponse
from app.services.activity_service import ActivityService
from app.services.project_service import ProjectService
from app.services.evm_calculator import calculate_activity_evm

router = APIRouter(tags=["Activities"])


# ── CRUD Endpoints ───────────────────────────────────────────────

@router.post(
    "/projects/{project_id}/activities",
    response_model=ActivityResponse,
    status_code=201,
)
async def create_activity(
    project_id: uuid.UUID,
    data: ActivityCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a new activity under a specific project."""
    # Verify project exists first
    project_service = ProjectService(db)
    project = await project_service.get_by_id(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    activity_service = ActivityService(db)
    activity = await activity_service.create(project_id, data)
    return activity


@router.get(
    "/projects/{project_id}/activities",
    response_model=list[ActivityResponse],
)
async def list_activities(
    project_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """List all activities for a project."""
    # Verify project exists
    project_service = ProjectService(db)
    project = await project_service.get_by_id(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    activity_service = ActivityService(db)
    activities = await activity_service.list_by_project(project_id)
    return list(activities)


@router.put("/activities/{activity_id}", response_model=ActivityResponse)
async def update_activity(
    activity_id: uuid.UUID,
    data: ActivityUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update an existing activity."""
    activity_service = ActivityService(db)
    activity = await activity_service.update(activity_id, data)
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    return activity


@router.delete("/activities/{activity_id}", status_code=204)
async def delete_activity(
    activity_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Delete an activity."""
    activity_service = ActivityService(db)
    deleted = await activity_service.delete(activity_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Activity not found")
    return None


# ── EVM Endpoint ─────────────────────────────────────────────────

@router.get(
    "/projects/{project_id}/activities/{activity_id}/evm",
    response_model=ActivityEVMResponse,
)
async def get_activity_evm(
    project_id: uuid.UUID,
    activity_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get EVM indicators for a single activity."""
    # Verify project exists
    project_service = ProjectService(db)
    project = await project_service.get_by_id(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Get activity
    activity_service = ActivityService(db)
    activity = await activity_service.get_by_id(activity_id)
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")

    # Verify activity belongs to the specified project
    if activity.project_id != project_id:
        raise HTTPException(
            status_code=404,
            detail="Activity not found in this project",
        )

    # Calculate EVM
    return calculate_activity_evm(activity)
