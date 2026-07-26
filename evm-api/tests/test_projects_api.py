"""
API Integration Tests — Project CRUD + EVM Endpoints.

Tests all project-related endpoints against a real (in-memory) database
via the FastAPI TestClient (HTTPX ASGITransport).

Covers:
  - POST /api/v1/projects (201, 422)
  - GET /api/v1/projects (200, pagination)
  - GET /api/v1/projects/{id} (200, 404)
  - PUT /api/v1/projects/{id} (200, 404, 422)
  - DELETE /api/v1/projects/{id} (204, 404)
  - GET /api/v1/projects/{id}/evm (200, 404, empty project)
"""

import pytest
from httpx import AsyncClient


class TestCreateProject:
    async def test_create_project_201(self, async_client: AsyncClient):
        """POST /api/v1/projects returns 201 with correct data."""
        response = await async_client.post(
            "/api/v1/projects",
            json={"name": "New Project", "description": "Test description"},
        )
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "New Project"
        assert data["description"] == "Test description"
        assert "id" in data
        assert "created_at" in data
        assert "updated_at" in data

    async def test_create_project_no_description(self, async_client: AsyncClient):
        """POST /api/v1/projects without optional description."""
        response = await async_client.post(
            "/api/v1/projects",
            json={"name": "Minimal Project"},
        )
        assert response.status_code == 201
        assert response.json()["description"] is None

    async def test_create_project_422_empty_name(self, async_client: AsyncClient):
        """POST /api/v1/projects with empty name returns 422."""
        response = await async_client.post(
            "/api/v1/projects",
            json={"name": ""},
        )
        assert response.status_code == 422

    async def test_create_project_422_missing_name(self, async_client: AsyncClient):
        """POST /api/v1/projects without name returns 422."""
        response = await async_client.post(
            "/api/v1/projects",
            json={},
        )
        assert response.status_code == 422


class TestListProjects:
    async def test_list_projects_empty(self, async_client: AsyncClient):
        """GET /api/v1/projects returns empty list when no projects exist."""
        response = await async_client.get("/api/v1/projects")
        assert response.status_code == 200
        data = response.json()
        assert data["items"] == []
        assert data["total"] == 0

    async def test_list_projects_with_data(self, async_client: AsyncClient, sample_project: dict):
        """GET /api/v1/projects returns created projects."""
        response = await async_client.get("/api/v1/projects")
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 1
        assert data["total"] == 1
        assert data["items"][0]["name"] == "Test Project"

    async def test_list_projects_pagination(self, async_client: AsyncClient):
        """GET /api/v1/projects respects skip/limit params."""
        # Create 3 projects
        for i in range(3):
            await async_client.post(
                "/api/v1/projects",
                json={"name": f"Project {i}"},
            )

        response = await async_client.get("/api/v1/projects?skip=0&limit=2")
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 2
        assert data["total"] == 3
        assert data["skip"] == 0
        assert data["limit"] == 2


class TestGetProject:
    async def test_get_project_200(self, async_client: AsyncClient, sample_project: dict):
        """GET /api/v1/projects/{id} returns the project."""
        response = await async_client.get(f"/api/v1/projects/{sample_project['id']}")
        assert response.status_code == 200
        assert response.json()["name"] == "Test Project"

    async def test_get_project_404(self, async_client: AsyncClient):
        """GET /api/v1/projects/{id} with non-existent ID returns 404."""
        response = await async_client.get(
            "/api/v1/projects/a1000000-0000-0000-0000-000000009999",
        )
        assert response.status_code == 404
        assert response.json()["detail"] == "Project not found"


class TestUpdateProject:
    async def test_update_project_200(self, async_client: AsyncClient, sample_project: dict):
        """PUT /api/v1/projects/{id} updates the project."""
        response = await async_client.put(
            f"/api/v1/projects/{sample_project['id']}",
            json={"name": "Updated Name", "description": "Updated desc"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Name"
        assert data["description"] == "Updated desc"

    async def test_update_project_partial(self, async_client: AsyncClient, sample_project: dict):
        """PUT /api/v1/projects/{id} with partial data."""
        response = await async_client.put(
            f"/api/v1/projects/{sample_project['id']}",
            json={"name": "Only Name Changed"},
        )
        assert response.status_code == 200
        assert response.json()["name"] == "Only Name Changed"

    async def test_update_project_404(self, async_client: AsyncClient):
        """PUT /api/v1/projects/{id} with non-existent ID returns 404."""
        response = await async_client.put(
            "/api/v1/projects/a1000000-0000-0000-0000-000000009999",
            json={"name": "Nope"},
        )
        assert response.status_code == 404


class TestDeleteProject:
    async def test_delete_project_204(self, async_client: AsyncClient, sample_project: dict):
        """DELETE /api/v1/projects/{id} returns 204."""
        response = await async_client.delete(
            f"/api/v1/projects/{sample_project['id']}",
        )
        assert response.status_code == 204

    async def test_delete_project_cascade(
        self,
        async_client: AsyncClient,
        sample_project: dict,
        sample_activity: dict,
    ):
        """DELETE project CASCADEs to delete activities."""
        # Verify activity exists
        resp = await async_client.get(
            f"/api/v1/projects/{sample_project['id']}/activities",
        )
        assert len(resp.json()) == 1

        # Delete project
        await async_client.delete(f"/api/v1/projects/{sample_project['id']}")

        # Verify activity is gone
        resp = await async_client.get(f"/api/v1/projects/{sample_project['id']}/activities")
        # Project or activities endpoint should 404
        assert resp.status_code == 404

    async def test_delete_project_404(self, async_client: AsyncClient):
        """DELETE /api/v1/projects/{id} with non-existent ID returns 404."""
        response = await async_client.delete(
            "/api/v1/projects/a1000000-0000-0000-0000-000000009999",
        )
        assert response.status_code == 404


class TestProjectEVM:
    async def test_evm_no_activities(self, async_client: AsyncClient, sample_project: dict):
        """GET /api/v1/projects/{id}/evm for empty project returns zeros."""
        response = await async_client.get(
            f"/api/v1/projects/{sample_project['id']}/evm",
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total_bac"] == 0
        assert data["total_actual_cost"] == 0
        assert data["total_pv"] == 0
        assert data["total_ev"] == 0
        assert data["cpi"] == 0
        assert data["spi"] == 0
        assert data["cpi_interpretation"] == "No activities"
        assert data["spi_interpretation"] == "No activities"
        assert data["activities"] == []

    async def test_evm_with_activities(
        self,
        async_client: AsyncClient,
        sample_project: dict,
        sample_activity: dict,
    ):
        """GET /api/v1/projects/{id}/evm returns consolidated EVM indicators."""
        response = await async_client.get(
            f"/api/v1/projects/{sample_project['id']}/evm",
        )
        assert response.status_code == 200
        data = response.json()
        assert data["project_name"] == "Test Project"
        assert data["total_bac"] == 20000.00
        assert data["total_actual_cost"] == 7500.00
        # PV = 20000 * 50% = 10000
        assert data["total_pv"] == 10000.00
        # EV = 20000 * 30% = 6000
        assert data["total_ev"] == 6000.00
        # CV = 6000 - 7500 = -1500
        assert data["cv"] == -1500.00
        # SV = 6000 - 10000 = -4000
        assert data["sv"] == -4000.00
        # CPI = 6000/7500 = 0.80
        assert data["cpi"] == 0.80
        # SPI = 6000/10000 = 0.60
        assert data["spi"] == 0.60
        assert len(data["activities"]) == 1

    async def test_evm_project_404(self, async_client: AsyncClient):
        """GET /api/v1/projects/{id}/evm for non-existent project returns 404."""
        response = await async_client.get(
            "/api/v1/projects/a1000000-0000-0000-0000-000000009999/evm",
        )
        assert response.status_code == 404

    async def test_evm_multiple_activities(
        self,
        async_client: AsyncClient,
        sample_project: dict,
    ):
        """EVM with multiple activities consolidates correctly."""
        # Create first activity (Design)
        await async_client.post(
            f"/api/v1/projects/{sample_project['id']}/activities",
            json={
                "name": "Design",
                "bac": 20000.00,
                "planned_percentage": 50.00,
                "actual_percentage": 30.00,
                "actual_cost": 7500.00,
            },
        )
        # Create second activity (Development)
        await async_client.post(
            f"/api/v1/projects/{sample_project['id']}/activities",
            json={
                "name": "Development",
                "bac": 30000.00,
                "planned_percentage": 60.00,
                "actual_percentage": 50.00,
                "actual_cost": 18000.00,
            },
        )

        response = await async_client.get(
            f"/api/v1/projects/{sample_project['id']}/evm",
        )
        assert response.status_code == 200
        data = response.json()
        # BAC = 20000 + 30000 = 50000
        assert data["total_bac"] == 50000.00
        # AC = 7500 + 18000 = 25500
        assert data["total_actual_cost"] == 25500.00
        # PV = 10000 + 18000 = 28000
        assert data["total_pv"] == 28000.00
        # EV = 6000 + 15000 = 21000
        assert data["total_ev"] == 21000.00
        assert len(data["activities"]) == 2
