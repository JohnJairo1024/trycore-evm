"""
Project service — business logic for project CRUD operations.
"""

import uuid
from typing import Sequence

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.project import Project
from app.schemas.project import ProjectCreate, ProjectUpdate


class ProjectService:
    """Handles all project-related business logic."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, data: ProjectCreate) -> Project:
        """Create a new project."""
        project = Project(
            id=uuid.uuid4(),
            name=data.name,
            description=data.description,
        )
        self.db.add(project)
        await self.db.flush()
        await self.db.refresh(project)
        return project

    async def get_by_id(self, project_id: uuid.UUID) -> Project | None:
        """Get a single project by ID."""
        result = await self.db.execute(
            select(Project).where(Project.id == project_id)
        )
        return result.scalar_one_or_none()

    async def list_all(
        self,
        skip: int = 0,
        limit: int = 100,
    ) -> tuple[Sequence[Project], int]:
        """List projects with pagination. Returns (items, total_count)."""
        # Get total count
        count_result = await self.db.execute(select(func.count(Project.id)))
        total = count_result.scalar() or 0

        # Get paginated items
        result = await self.db.execute(
            select(Project)
            .order_by(Project.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        items = result.scalars().all()

        return items, total

    async def update(self, project_id: uuid.UUID, data: ProjectUpdate) -> Project | None:
        """Update an existing project. Returns None if not found."""
        project = await self.get_by_id(project_id)
        if not project:
            return None

        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(project, field, value)

        await self.db.flush()
        await self.db.refresh(project)
        return project

    async def delete(self, project_id: uuid.UUID) -> bool:
        """Delete a project. Returns True if deleted, False if not found."""
        project = await self.get_by_id(project_id)
        if not project:
            return False

        await self.db.delete(project)
        await self.db.flush()
        return True
