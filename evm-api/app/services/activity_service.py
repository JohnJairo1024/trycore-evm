"""
Activity service — business logic for activity CRUD operations.
"""

import uuid
from decimal import Decimal
from typing import Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.activity import Activity
from app.schemas.activity import ActivityCreate, ActivityUpdate
from app.services.base_service import BaseService


class ActivityService(BaseService[Activity, ActivityUpdate]):
    """Handles all activity-related business logic."""

    _model = Activity

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, project_id: uuid.UUID, data: ActivityCreate) -> Activity:
        """Create a new activity under a given project."""
        activity = Activity(
            id=uuid.uuid4(),
            project_id=project_id,
            name=data.name,
            bac=data.bac,
            planned_percentage=data.planned_percentage,
            actual_percentage=data.actual_percentage,
            actual_cost=data.actual_cost,
        )
        self.db.add(activity)
        await self.db.flush()
        await self.db.refresh(activity)
        return activity

    async def get_by_id(self, activity_id: uuid.UUID) -> Activity | None:
        """Get a single activity by ID."""
        result = await self.db.execute(
            select(Activity).where(Activity.id == activity_id)
        )
        return result.scalar_one_or_none()

    async def list_by_project(
        self,
        project_id: uuid.UUID,
    ) -> Sequence[Activity]:
        """List all activities for a given project."""
        result = await self.db.execute(
            select(Activity)
            .where(Activity.project_id == project_id)
            .order_by(Activity.created_at)
        )
        return result.scalars().all()
