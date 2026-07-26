"""
Unit tests for the EVM Calculator service.

These tests verify the core business logic of EVM calculations
against known expected values (see GLOSARIO-EVM.md for examples).
"""

from decimal import Decimal
from uuid import UUID

import pytest

from app.models.activity import Activity
from app.models.project import Project
from app.services.evm_calculator import (
    calculate_activity_evm,
    calculate_project_evm,
)

# ── Helpers ──────────────────────────────────────────────────────

ZERO = Decimal("0")
MOCK_PROJECT_ID = UUID("a1000000-0000-0000-0000-000000000001")
MOCK_PROJECT_NAME = "Test Project"


def make_activity(
    name: str = "Test Activity",
    bac: Decimal = Decimal("100000.00"),
    planned_pct: Decimal = Decimal("50.00"),
    actual_pct: Decimal = Decimal("30.00"),
    actual_cost: Decimal = Decimal("45000.00"),
) -> Activity:
    """Create a mock Activity instance for testing."""
    return Activity(
        id=UUID("b0000000-0000-0000-0000-000000000001"),
        project_id=MOCK_PROJECT_ID,
        name=name,
        bac=bac,
        planned_percentage=planned_pct,
        actual_percentage=actual_pct,
        actual_cost=actual_cost,
    )


# ── Healthy Project (CPI > 1, SPI > 1) ──────────────────────────

class TestHealthyProject:
    """
    Example 1 from GLOSARIO-EVM.md:
    BAC=$100k, Plan=50%, Real=60%, AC=$45k
    Expected: CPI=1.33, SPI=1.20, CV=+$15k, SV=+$10k
    """

    @pytest.fixture
    def activity(self) -> Activity:
        return make_activity(
            bac=Decimal("100000.00"),
            planned_pct=Decimal("50.00"),
            actual_pct=Decimal("60.00"),
            actual_cost=Decimal("45000.00"),
        )

    def test_pv(self, activity: Activity):
        result = calculate_activity_evm(activity)
        assert result.pv == Decimal("50000.00")

    def test_ev(self, activity: Activity):
        result = calculate_activity_evm(activity)
        assert result.ev == Decimal("60000.00")

    def test_cv(self, activity: Activity):
        result = calculate_activity_evm(activity)
        assert result.cv == Decimal("15000.00")

    def test_sv(self, activity: Activity):
        result = calculate_activity_evm(activity)
        assert result.sv == Decimal("10000.00")

    def test_cpi(self, activity: Activity):
        result = calculate_activity_evm(activity)
        assert result.cpi == Decimal("1.33")

    def test_spi(self, activity: Activity):
        result = calculate_activity_evm(activity)
        assert result.spi == Decimal("1.20")

    def test_eac(self, activity: Activity):
        result = calculate_activity_evm(activity)
        assert result.eac == Decimal("75187.97")

    def test_vac(self, activity: Activity):
        result = calculate_activity_evm(activity)
        assert result.vac == Decimal("24812.03")

    def test_interpretations(self, activity: Activity):
        result = calculate_activity_evm(activity)
        assert result.cpi_interpretation == "Under budget"
        assert result.spi_interpretation == "Ahead of schedule"


# ── Warning Project (CPI < 1, SPI < 1) ──────────────────────────

class TestWarningProject:
    """
    Example 2 from GLOSARIO-EVM.md:
    BAC=$100k, Plan=50%, Real=30%, AC=$45k
    Expected: CPI=0.67, SPI=0.60, CV=-$15k, SV=-$20k
    """

    @pytest.fixture
    def activity(self) -> Activity:
        return make_activity(
            bac=Decimal("100000.00"),
            planned_pct=Decimal("50.00"),
            actual_pct=Decimal("30.00"),
            actual_cost=Decimal("45000.00"),
        )

    def test_pv(self, activity: Activity):
        result = calculate_activity_evm(activity)
        assert result.pv == Decimal("50000.00")

    def test_ev(self, activity: Activity):
        result = calculate_activity_evm(activity)
        assert result.ev == Decimal("30000.00")

    def test_cv(self, activity: Activity):
        result = calculate_activity_evm(activity)
        assert result.cv == Decimal("-15000.00")

    def test_sv(self, activity: Activity):
        result = calculate_activity_evm(activity)
        assert result.sv == Decimal("-20000.00")

    def test_cpi(self, activity: Activity):
        result = calculate_activity_evm(activity)
        assert result.cpi == Decimal("0.67")

    def test_spi(self, activity: Activity):
        result = calculate_activity_evm(activity)
        assert result.spi == Decimal("0.60")

    def test_interpretations(self, activity: Activity):
        result = calculate_activity_evm(activity)
        assert result.cpi_interpretation == "Over budget"
        assert result.spi_interpretation == "Behind schedule"


# ── Mixed Project (CPI < 1, SPI > 1) ────────────────────────────

class TestMixedProject:
    """
    Example 3 from GLOSARIO-EVM.md:
    BAC=$100k, Plan=50%, Real=70%, AC=$80k
    Expected: CPI=0.88, SPI=1.40, CV=-$10k, SV=+$20k
    """

    @pytest.fixture
    def activity(self) -> Activity:
        return make_activity(
            bac=Decimal("100000.00"),
            planned_pct=Decimal("50.00"),
            actual_pct=Decimal("70.00"),
            actual_cost=Decimal("80000.00"),
        )

    def test_cv(self, activity: Activity):
        result = calculate_activity_evm(activity)
        assert result.cv == Decimal("-10000.00")

    def test_sv(self, activity: Activity):
        result = calculate_activity_evm(activity)
        assert result.sv == Decimal("20000.00")

    def test_cpi(self, activity: Activity):
        result = calculate_activity_evm(activity)
        assert result.cpi == Decimal("0.88")

    def test_spi(self, activity: Activity):
        result = calculate_activity_evm(activity)
        assert result.spi == Decimal("1.40")

    def test_cpi_interpretation(self, activity: Activity):
        result = calculate_activity_evm(activity)
        assert result.cpi_interpretation == "Over budget"

    def test_spi_interpretation(self, activity: Activity):
        result = calculate_activity_evm(activity)
        assert result.spi_interpretation == "Ahead of schedule"


# ── Edge Cases ──────────────────────────────────────────────────

class TestEdgeCases:
    """Test edge cases: AC=0, PV=0, 1 activity, no activities."""

    def test_ac_zero(self):
        """When AC=0, CPI should be 0 and interpretation 'No cost data'."""
        activity = make_activity(actual_cost=ZERO)
        result = calculate_activity_evm(activity)
        assert result.cpi == ZERO
        assert result.cpi_interpretation == "No cost data"
        assert result.eac == ZERO

    def test_pv_zero(self):
        """When PV=0 (planned_percentage=0), SPI should be 0 and 'No schedule data'."""
        activity = make_activity(planned_pct=ZERO)
        result = calculate_activity_evm(activity)
        assert result.spi == ZERO
        assert result.spi_interpretation == "No schedule data"

    def test_actual_zero_with_cost(self):
        """
        When actual_percentage=0 but actual_cost>0:
        EV=0, CPI=0, CV = -AC
        """
        activity = make_activity(
            actual_pct=ZERO,
            actual_cost=Decimal("5000.00"),
        )
        result = calculate_activity_evm(activity)
        assert result.ev == ZERO
        assert result.cpi == ZERO
        assert result.cv == Decimal("-5000.00")


# ── Project-Level Consolidation ─────────────────────────────────

class TestProjectConsolidation:
    """Test that project-level EVM correctly consolidates activities."""

    def test_no_activities(self):
        """Project with no activities should return zeros and 'No activities'."""
        result = calculate_project_evm(
            project_id=MOCK_PROJECT_ID,
            project_name="Empty Project",
            activities=[],
        )
        assert result.total_bac == ZERO
        assert result.cpi == ZERO
        assert result.spi == ZERO
        assert result.cpi_interpretation == "No activities"
        assert result.spi_interpretation == "No activities"
        assert result.activities == []

    def test_single_activity(self):
        """Project with 1 activity should match that activity's indicators."""
        activity = make_activity(bac=Decimal("50000.00"), planned_pct=Decimal("100.00"),
                                 actual_pct=Decimal("100.00"), actual_cost=Decimal("40000.00"))
        result = calculate_project_evm(
            project_id=MOCK_PROJECT_ID,
            project_name="Single Activity Project",
            activities=[activity],
        )
        assert result.total_bac == Decimal("50000.00")
        assert result.cpi == Decimal("1.25")
        assert result.spi == Decimal("1.00")
        assert len(result.activities) == 1

    def test_multiple_activities_consolidation(self):
        """Project with multiple activities should sum correctly."""
        act1 = make_activity(name="Act1", bac=Decimal("20000.00"),
                             planned_pct=Decimal("50.00"), actual_pct=Decimal("30.00"),
                             actual_cost=Decimal("7500.00"))
        act2 = make_activity(name="Act2", bac=Decimal("30000.00"),
                             planned_pct=Decimal("60.00"), actual_pct=Decimal("50.00"),
                             actual_cost=Decimal("18000.00"))

        result = calculate_project_evm(
            project_id=MOCK_PROJECT_ID,
            project_name="Multi Activity Project",
            activities=[act1, act2],
        )

        # Expected from GLOSARIO examples
        assert result.total_bac == Decimal("50000.00")
        assert result.total_actual_cost == Decimal("25500.00")
        assert result.total_pv == Decimal("28000.00")  # 10000 + 18000
        assert result.total_ev == Decimal("21000.00")  # 6000 + 15000
        assert len(result.activities) == 2
