"""
Pytest configuration for EVM Dashboard API tests.

Provides:
  - In-memory SQLite database per test function
  - Overridden FastAPI dependency (get_db → test session)
  - HTTPX async client pointing to the FastAPI app
  - Factory fixtures for sample projects and activities
"""

import asyncio
import uuid
from decimal import Decimal
from typing import AsyncGenerator, Generator
from uuid import UUID

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.database import Base, get_db
from app.main import app

# ── Test Database (in-memory SQLite) ──────────────────────────────

TEST_DATABASE_URL = "sqlite+aiosqlite://"

test_engine = create_async_engine(TEST_DATABASE_URL, echo=False)
test_async_session_factory = async_sessionmaker(
    test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


@pytest.fixture(scope="session")
def event_loop() -> Generator[asyncio.AbstractEventLoop, None, None]:
    """Create a single event loop for the entire test session."""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


async def _override_get_db() -> AsyncGenerator[AsyncSession, None]:
    """Override the FastAPI dependency with a test database session."""
    async with test_async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


@pytest_asyncio.fixture(autouse=True)
async def setup_test_db():
    """Create tables before each test, drop after. Gives clean state per test."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def async_client() -> AsyncGenerator[AsyncClient, None]:
    """Provide an HTTPX async client with overridden DB dependency."""
    app.dependency_overrides[get_db] = _override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(
        transport=transport,
        base_url="http://test",
    ) as client:
        yield client
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Provide a raw test database session for service-level tests."""
    async with test_async_session_factory() as session:
        yield session


# ── Factory Helpers ───────────────────────────────────────────────

PROJECT_UUID = UUID("a1000000-0000-0000-0000-000000000001")
ACTIVITY_UUID = UUID("b1000000-0000-0000-0000-000000000001")


@pytest_asyncio.fixture
async def sample_project(async_client: AsyncClient) -> dict:
    """Create a sample project via the API and return its data."""
    response = await async_client.post(
        "/api/v1/projects",
        json={"name": "Test Project", "description": "A test project"},
    )
    assert response.status_code == 201
    return response.json()


@pytest_asyncio.fixture
async def sample_activity(async_client: AsyncClient, sample_project: dict) -> dict:
    """Create a sample activity under the sample project via the API."""
    response = await async_client.post(
        f"/api/v1/projects/{sample_project['id']}/activities",
        json={
            "name": "Design",
            "bac": 20000.00,
            "planned_percentage": 50.00,
            "actual_percentage": 30.00,
            "actual_cost": 7500.00,
        },
    )
    assert response.status_code == 201
    return response.json()
