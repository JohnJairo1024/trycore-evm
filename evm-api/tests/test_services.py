"""
Unit Tests — ProjectService and ActivityService.

Tests the service layer business logic with a real (in-memory) database session.
Uses the db_session fixture from conftest.py.
"""

import uuid
from decimal import Decimal

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.project import ProjectCreate, ProjectUpdate
from app.schemas.activity import ActivityCreate, ActivityUpdate
from app.services.project_service import ProjectService
from app.services.activity_service import ActivityService


# ── ProjectService ───────────────────────────────────────────────

class TestProjectService:
    async def test_create_project(self, db_session: AsyncSession):
        service = ProjectService(db_session)
        project = await service.create(
            ProjectCreate(name="Test Project", description="Desc"),
        )
        assert project.name == "Test Project"
        assert project.description == "Desc"
        assert project.id is not None

    async def test_create_project_minimal(self, db_session: AsyncSession):
        service = ProjectService(db_session)
        project = await service.create(ProjectCreate(name="Minimal"))
        assert project.name == "Minimal"
        assert project.description is None

    async def test_get_by_id_found(self, db_session: AsyncSession):
        service = ProjectService(db_session)
        created = await service.create(ProjectCreate(name="Find Me"))
        found = await service.get_by_id(created.id)
        assert found is not None
        assert found.name == "Find Me"

    async def test_get_by_id_not_found(self, db_session: AsyncSession):
        service = ProjectService(db_session)
        result = await service.get_by_id(uuid.uuid4())
        assert result is None

    async def test_list_all_empty(self, db_session: AsyncSession):
        service = ProjectService(db_session)
        items, total = await service.list_all()
        assert items == []
        assert total == 0

    async def test_list_all_with_data(self, db_session: AsyncSession):
        service = ProjectService(db_session)
        await service.create(ProjectCreate(name="Project A"))
        await service.create(ProjectCreate(name="Project B"))

        items, total = await service.list_all()
        assert len(items) == 2
        assert total == 2

    async def test_list_all_pagination(self, db_session: AsyncSession):
        service = ProjectService(db_session)
        for i in range(5):
            await service.create(ProjectCreate(name=f"Project {i}"))

        items, total = await service.list_all(skip=0, limit=3)
        assert len(items) == 3
        assert total == 5

    async def test_update_project(self, db_session: AsyncSession):
        service = ProjectService(db_session)
        created = await service.create(ProjectCreate(name="Original"))

        updated = await service.update(
            created.id,
            ProjectUpdate(name="Updated", description="New desc"),
        )
        assert updated is not None
        assert updated.name == "Updated"
        assert updated.description == "New desc"

    async def test_update_project_not_found(self, db_session: AsyncSession):
        service = ProjectService(db_session)
        result = await service.update(
            uuid.uuid4(),
            ProjectUpdate(name="Nope"),
        )
        assert result is None

    async def test_delete_project(self, db_session: AsyncSession):
        service = ProjectService(db_session)
        created = await service.create(ProjectCreate(name="To Delete"))

        deleted = await service.delete(created.id)
        assert deleted is True

        # Verify gone
        found = await service.get_by_id(created.id)
        assert found is None

    async def test_delete_project_not_found(self, db_session: AsyncSession):
        service = ProjectService(db_session)
        result = await service.delete(uuid.uuid4())
        assert result is False


# ── ActivityService ──────────────────────────────────────────────

class TestActivityService:
    async def test_create_activity(self, db_session: AsyncSession):
        # First create a project
        project_service = ProjectService(db_session)
        project = await project_service.create(ProjectCreate(name="Test Project"))

        service = ActivityService(db_session)
        activity = await service.create(
            project.id,
            ActivityCreate(
                name="Design",
                bac=Decimal("20000.00"),
                planned_percentage=Decimal("50.00"),
                actual_percentage=Decimal("30.00"),
                actual_cost=Decimal("7500.00"),
            ),
        )
        assert activity.name == "Design"
        assert activity.bac == Decimal("20000.00")
        assert activity.project_id == project.id

    async def test_get_by_id_found(self, db_session: AsyncSession):
        project_service = ProjectService(db_session)
        project = await project_service.create(ProjectCreate(name="Test"))

        service = ActivityService(db_session)
        created = await service.create(
            project.id,
            ActivityCreate(
                name="Find Me",
                bac=Decimal("10000.00"),
                planned_percentage=Decimal("50.00"),
                actual_percentage=Decimal("30.00"),
                actual_cost=Decimal("5000.00"),
            ),
        )
        found = await service.get_by_id(created.id)
        assert found is not None
        assert found.name == "Find Me"

    async def test_get_by_id_not_found(self, db_session: AsyncSession):
        service = ActivityService(db_session)
        result = await service.get_by_id(uuid.uuid4())
        assert result is None

    async def test_list_by_project(self, db_session: AsyncSession):
        project_service = ProjectService(db_session)
        project = await project_service.create(ProjectCreate(name="Test"))

        service = ActivityService(db_session)
        await service.create(
            project.id,
            ActivityCreate(
                name="Act1",
                bac=Decimal("10000.00"),
                planned_percentage=Decimal("50.00"),
                actual_percentage=Decimal("30.00"),
                actual_cost=Decimal("5000.00"),
            ),
        )
        await service.create(
            project.id,
            ActivityCreate(
                name="Act2",
                bac=Decimal("20000.00"),
                planned_percentage=Decimal("60.00"),
                actual_percentage=Decimal("50.00"),
                actual_cost=Decimal("12000.00"),
            ),
        )

        activities = await service.list_by_project(project.id)
        assert len(activities) == 2
        assert activities[0].name == "Act1"
        assert activities[1].name == "Act2"

    async def test_update_activity(self, db_session: AsyncSession):
        project_service = ProjectService(db_session)
        project = await project_service.create(ProjectCreate(name="Test"))

        service = ActivityService(db_session)
        created = await service.create(
            project.id,
            ActivityCreate(
                name="Original",
                bac=Decimal("10000.00"),
                planned_percentage=Decimal("50.00"),
                actual_percentage=Decimal("30.00"),
                actual_cost=Decimal("5000.00"),
            ),
        )

        updated = await service.update(
            created.id,
            ActivityUpdate(
                name="Updated",
                actual_percentage=Decimal("45.00"),
            ),
        )
        assert updated is not None
        assert updated.name == "Updated"
        assert updated.actual_percentage == Decimal("45.00")

    async def test_update_activity_not_found(self, db_session: AsyncSession):
        service = ActivityService(db_session)
        result = await service.update(
            uuid.uuid4(),
            ActivityUpdate(name="Nope"),
        )
        assert result is None

    async def test_delete_activity(self, db_session: AsyncSession):
        project_service = ProjectService(db_session)
        project = await project_service.create(ProjectCreate(name="Test"))

        service = ActivityService(db_session)
        created = await service.create(
            project.id,
            ActivityCreate(
                name="To Delete",
                bac=Decimal("10000.00"),
                planned_percentage=Decimal("50.00"),
                actual_percentage=Decimal("30.00"),
                actual_cost=Decimal("5000.00"),
            ),
        )

        deleted = await service.delete(created.id)
        assert deleted is True

        found = await service.get_by_id(created.id)
        assert found is None

    async def test_delete_activity_not_found(self, db_session: AsyncSession):
        service = ActivityService(db_session)
        result = await service.delete(uuid.uuid4())
        assert result is False
