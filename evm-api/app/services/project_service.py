"""
Project service — business logic for project CRUD operations.
"""

import uuid
from typing import Sequence

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.project import Project
from app.schemas.project import ProjectCreate, ProjectUpdate
from app.services.base_service import BaseService


class ProjectService(BaseService[Project, ProjectUpdate]):
    """Handles all project-related business logic."""

    _model = Project

    def __init__(self, db: AsyncSession):
        super().__init__(db)
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
        count_result = await self.db.execute(select(func.count(Project.id)))
        total = count_result.scalar() or 0

        result = await self.db.execute(
            select(Project)
            .order_by(Project.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        items = result.scalars().all()

        return items, total
