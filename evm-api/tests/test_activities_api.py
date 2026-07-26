"""
API Integration Tests — Activity CRUD + Activity EVM Endpoints.

Tests all activity-related endpoints against a real (in-memory) database.

Covers:
  - POST /api/v1/projects/{project_id}/activities (201, 404, 422)
  - GET /api/v1/projects/{project_id}/activities (200, 404)
  - PUT /api/v1/activities/{id} (200, 404, 422)
  - DELETE /api/v1/activities/{id} (204, 404)
  - GET /api/v1/projects/{project_id}/activities/{activity_id}/evm (200, 404)
"""

import pytest
from httpx import AsyncClient


class TestCreateActivity:
    async def test_create_activity_201(
        self,
        async_client: AsyncClient,
        sample_project: dict,
    ):
        """POST activity returns 201 with correct data."""
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
        data = response.json()
        assert data["name"] == "Design"
        assert data["bac"] == 20000.00
        assert data["planned_percentage"] == 50.00
        assert data["actual_percentage"] == 30.00
        assert data["actual_cost"] == 7500.00
        assert data["project_id"] == sample_project["id"]
        assert "id" in data

    async def test_create_activity_404_project_not_found(
        self,
        async_client: AsyncClient,
    ):
        """POST activity for non-existent project returns 404."""
        response = await async_client.post(
            "/api/v1/projects/a1000000-0000-0000-0000-000000009999/activities",
            json={
                "name": "Design",
                "bac": 20000.00,
                "planned_percentage": 50.00,
                "actual_percentage": 30.00,
                "actual_cost": 7500.00,
            },
        )
        assert response.status_code == 404
        assert response.json()["detail"] == "Project not found"

    async def test_create_activity_422_invalid_bac(
        self,
        async_client: AsyncClient,
        sample_project: dict,
    ):
        """POST activity with BAC <= 0 returns 422."""
        response = await async_client.post(
            f"/api/v1/projects/{sample_project['id']}/activities",
            json={
                "name": "Bad Activity",
                "bac": 0,
                "planned_percentage": 50.00,
                "actual_percentage": 30.00,
                "actual_cost": 7500.00,
            },
        )
        assert response.status_code == 422

    async def test_create_activity_422_invalid_percentage(
        self,
        async_client: AsyncClient,
        sample_project: dict,
    ):
        """POST activity with percentage > 100 returns 422."""
        response = await async_client.post(
            f"/api/v1/projects/{sample_project['id']}/activities",
            json={
                "name": "Bad Activity",
                "bac": 10000.00,
                "planned_percentage": 150.00,
                "actual_percentage": 30.00,
                "actual_cost": 5000.00,
            },
        )
        assert response.status_code == 422

    async def test_create_activity_422_missing_name(
        self,
        async_client: AsyncClient,
        sample_project: dict,
    ):
        """POST activity without name returns 422."""
        response = await async_client.post(
            f"/api/v1/projects/{sample_project['id']}/activities",
            json={
                "bac": 10000.00,
                "planned_percentage": 50.00,
                "actual_percentage": 30.00,
                "actual_cost": 5000.00,
            },
        )
        assert response.status_code == 422


class TestListActivities:
    async def test_list_activities_empty(
        self,
        async_client: AsyncClient,
        sample_project: dict,
    ):
        """GET activities for project with no activities returns empty list."""
        response = await async_client.get(
            f"/api/v1/projects/{sample_project['id']}/activities",
        )
        assert response.status_code == 200
        assert response.json() == []

    async def test_list_activities_with_data(
        self,
        async_client: AsyncClient,
        sample_project: dict,
        sample_activity: dict,
    ):
        """GET activities returns created activities."""
        response = await async_client.get(
            f"/api/v1/projects/{sample_project['id']}/activities",
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["name"] == "Design"

    async def test_list_activities_404_project_not_found(
        self,
        async_client: AsyncClient,
    ):
        """GET activities for non-existent project returns 404."""
        response = await async_client.get(
            "/api/v1/projects/a1000000-0000-0000-0000-000000009999/activities",
        )
        assert response.status_code == 404

    async def test_list_activities_multiple(
        self,
        async_client: AsyncClient,
        sample_project: dict,
    ):
        """GET activities returns all activities ordered by creation."""
        # Create activity 1
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
        # Create activity 2
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
            f"/api/v1/projects/{sample_project['id']}/activities",
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert data[0]["name"] == "Design"
        assert data[1]["name"] == "Development"


class TestUpdateActivity:
    async def test_update_activity_200(
        self,
        async_client: AsyncClient,
        sample_activity: dict,
    ):
        """PUT activity returns 200 with updated data."""
        response = await async_client.put(
            f"/api/v1/activities/{sample_activity['id']}",
            json={
                "name": "Updated Design",
                "bac": 25000.00,
                "actual_percentage": 45.00,
                "actual_cost": 10000.00,
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Design"
        assert data["bac"] == 25000.00
        assert data["actual_percentage"] == 45.00

    async def test_update_activity_partial(
        self,
        async_client: AsyncClient,
        sample_activity: dict,
    ):
        """PUT activity with single field update."""
        response = await async_client.put(
            f"/api/v1/activities/{sample_activity['id']}",
            json={"name": "Only Name Changed"},
        )
        assert response.status_code == 200
        assert response.json()["name"] == "Only Name Changed"

    async def test_update_activity_404(self, async_client: AsyncClient):
        """PUT activity with non-existent ID returns 404."""
        response = await async_client.put(
            "/api/v1/activities/b1000000-0000-0000-0000-000000009999",
            json={"name": "Nope"},
        )
        assert response.status_code == 404
        assert response.json()["detail"] == "Activity not found"


class TestDeleteActivity:
    async def test_delete_activity_204(
        self,
        async_client: AsyncClient,
        sample_activity: dict,
    ):
        """DELETE activity returns 204."""
        response = await async_client.delete(
            f"/api/v1/activities/{sample_activity['id']}",
        )
        assert response.status_code == 204

    async def test_delete_activity_removes_from_list(
        self,
        async_client: AsyncClient,
        sample_project: dict,
        sample_activity: dict,
    ):
        """After DELETE, activity is no longer listed."""
        await async_client.delete(f"/api/v1/activities/{sample_activity['id']}")

        response = await async_client.get(
            f"/api/v1/projects/{sample_project['id']}/activities",
        )
        assert response.status_code == 200
        assert response.json() == []

    async def test_delete_activity_404(self, async_client: AsyncClient):
        """DELETE activity with non-existent ID returns 404."""
        response = await async_client.delete(
            "/api/v1/activities/b1000000-0000-0000-0000-000000009999",
        )
        assert response.status_code == 404


class TestActivityEVM:
    async def test_activity_evm_200(
        self,
        async_client: AsyncClient,
        sample_project: dict,
        sample_activity: dict,
    ):
        """GET activity EVM returns correct indicators."""
        response = await async_client.get(
            f"/api/v1/projects/{sample_project['id']}/activities/{sample_activity['id']}/evm",
        )
        assert response.status_code == 200
        data = response.json()
        assert data["activity_name"] == "Design"
        assert data["bac"] == 20000.00
        # PV = 20000 * 50% = 10000
        assert data["pv"] == 10000.00
        # EV = 20000 * 30% = 6000
        assert data["ev"] == 6000.00
        # CV = 6000 - 7500 = -1500
        assert data["cv"] == -1500.00
        # SV = 6000 - 10000 = -4000
        assert data["sv"] == -4000.00
        # CPI = 6000/7500 = 0.80
        assert data["cpi"] == 0.80
        # SPI = 6000/10000 = 0.60
        assert data["spi"] == 0.60
        assert data["cpi_interpretation"] == "Over budget"
        assert data["spi_interpretation"] == "Behind schedule"

    async def test_activity_evm_404_activity_not_found(
        self,
        async_client: AsyncClient,
        sample_project: dict,
    ):
        """GET EVM for non-existent activity returns 404."""
        response = await async_client.get(
            f"/api/v1/projects/{sample_project['id']}/activities/"
            "b1000000-0000-0000-0000-000000009999/evm",
        )
        assert response.status_code == 404

    async def test_activity_evm_404_project_not_found(
        self,
        async_client: AsyncClient,
    ):
        """GET EVM for non-existent project returns 404."""
        response = await async_client.get(
            "/api/v1/projects/a1000000-0000-0000-0000-000000009999/activities/"
            "b1000000-0000-0000-0000-000000000001/evm",
        )
        assert response.status_code == 404

    async def test_activity_evm_wrong_project(
        self,
        async_client: AsyncClient,
        sample_project: dict,
        sample_activity: dict,
    ):
        """GET EVM with mismatched project/activity returns 404."""
        # Create another project
        resp = await async_client.post(
            "/api/v1/projects",
            json={"name": "Other Project"},
        )
        other_project = resp.json()

        # Try to get EVM with wrong project
        response = await async_client.get(
            f"/api/v1/projects/{other_project['id']}/activities/{sample_activity['id']}/evm",
        )
        assert response.status_code == 404
        assert response.json()["detail"] == "Activity not found in this project"
