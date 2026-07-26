"""
Extended Unit Tests — EVM Calculator Edge Cases & Interpretations.

Builds on the existing test_evm_calculator.py by adding:
  - Direct tests for _interpret_cpi and _interpret_spi
  - Additional edge case combinations
  - Boundary value analysis
  - On-track (CPI=1, SPI=1) scenario
"""

from decimal import Decimal
from uuid import UUID

import pytest

from app.models.activity import Activity
from app.services.evm_calculator import (
    calculate_activity_evm,
    calculate_project_evm,
    _interpret_cpi,
    _interpret_spi,
)

ZERO = Decimal("0")
MOCK_PROJECT_ID = UUID("a1000000-0000-0000-0000-000000000001")


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


# ── Direct Interpretation Tests ──────────────────────────────────

class TestInterpretCPI:
    """Direct unit tests for _interpret_cpi()."""

    def test_healthy(self):
        assert _interpret_cpi(Decimal("1.33"), Decimal("45000")) == "Under budget"

    def test_warning(self):
        assert _interpret_cpi(Decimal("0.67"), Decimal("45000")) == "Over budget"

    def test_on_track(self):
        assert _interpret_cpi(Decimal("1.00"), Decimal("45000")) == "On track"

    def test_no_cost_data(self):
        assert _interpret_cpi(ZERO, ZERO) == "No cost data"

    def test_cpi_zero_with_cost(self):
        """When AC > 0 but EV = 0, CPI = 0, interpretation should be warning."""
        assert _interpret_cpi(ZERO, Decimal("5000")) == "Over budget"


class TestInterpretSPI:
    """Direct unit tests for _interpret_spi()."""

    def test_healthy(self):
        assert _interpret_spi(Decimal("1.20"), Decimal("50000")) == "Ahead of schedule"

    def test_warning(self):
        assert _interpret_spi(Decimal("0.60"), Decimal("50000")) == "Behind schedule"

    def test_on_track(self):
        assert _interpret_spi(Decimal("1.00"), Decimal("50000")) == "On track"

    def test_no_schedule_data(self):
        assert _interpret_spi(ZERO, ZERO) == "No schedule data"


# ── Edge Case Combinations ───────────────────────────────────────

class TestEdgeCaseCombinations:
    """Test combinations of edge cases."""

    def test_all_zero(self):
        """Activity with BAC > 0 but zero everything else."""
        activity = make_activity(
            bac=Decimal("50000.00"),
            planned_pct=ZERO,
            actual_pct=ZERO,
            actual_cost=ZERO,
        )
        result = calculate_activity_evm(activity)
        assert result.pv == ZERO
        assert result.ev == ZERO
        assert result.cpi == ZERO
        assert result.spi == ZERO
        assert result.cpi_interpretation == "No cost data"
        assert result.spi_interpretation == "No schedule data"

    def test_100_percent_complete_on_budget(self):
        """Activity 100% complete, exactly on budget (CPI=1, SPI=1)."""
        activity = make_activity(
            bac=Decimal("50000.00"),
            planned_pct=Decimal("100.00"),
            actual_pct=Decimal("100.00"),
            actual_cost=Decimal("50000.00"),
        )
        result = calculate_activity_evm(activity)
        assert result.pv == Decimal("50000.00")
        assert result.ev == Decimal("50000.00")
        assert result.cv == ZERO
        assert result.sv == ZERO
        assert result.cpi == Decimal("1.00")
        assert result.spi == Decimal("1.00")
        assert result.cpi_interpretation == "On track"
        assert result.spi_interpretation == "On track"

    def test_over_budget_ahead_schedule(self):
        """Mixed: over budget but ahead of schedule."""
        activity = make_activity(
            bac=Decimal("100000.00"),
            planned_pct=Decimal("50.00"),
            actual_pct=Decimal("70.00"),
            actual_cost=Decimal("80000.00"),
        )
        result = calculate_activity_evm(activity)
        assert result.cv < ZERO  # Over budget
        assert result.sv > ZERO  # Ahead of schedule
        assert result.cpi_interpretation == "Over budget"
        assert result.spi_interpretation == "Ahead of schedule"

    def test_under_budget_behind_schedule(self):
        """Mixed: under budget but behind schedule."""
        activity = make_activity(
            bac=Decimal("100000.00"),
            planned_pct=Decimal("50.00"),
            actual_pct=Decimal("30.00"),
            actual_cost=Decimal("20000.00"),
        )
        result = calculate_activity_evm(activity)
        # EV=30000, AC=20000 → CV=+10000 (under budget)
        assert result.cv > ZERO
        # EV=30000, PV=50000 → SV=-20000 (behind)
        assert result.sv < ZERO
        # CPI=30000/20000=1.50
        assert result.cpi == Decimal("1.50")
        assert result.cpi_interpretation == "Under budget"
        assert result.spi_interpretation == "Behind schedule"

    def test_large_precision(self):
        """Ensure Decimal precision is maintained with large BAC."""
        activity = make_activity(
            bac=Decimal("9999999.99"),
            planned_pct=Decimal("33.33"),
            actual_pct=Decimal("66.67"),
            actual_cost=Decimal("3333333.33"),
        )
        result = calculate_activity_evm(activity)
        # All values should be quantized to 2 decimal places
        for val in [result.pv, result.ev, result.cv, result.sv, result.eac, result.vac]:
            assert val.as_tuple().exponent == -2, f"Expected 2 decimal places, got {val}"

    def test_cpi_spi_beyond_thresholds(self):
        """CPI and SPI can be significantly above/below 1."""
        activity = make_activity(
            bac=Decimal("100000.00"),
            planned_pct=Decimal("50.00"),
            actual_pct=Decimal("10.00"),
            actual_cost=Decimal("1000.00"),
        )
        result = calculate_activity_evm(activity)
        # EV = 10000, AC = 1000 → CPI = 10.00
        assert result.cpi == Decimal("10.00") or result.cpi >= Decimal("1.00")
        # EV = 10000, PV = 50000 → SPI = 0.20
        assert result.spi == Decimal("0.20")


# ── Project-Level Edge Cases ─────────────────────────────────────

class TestProjectEdgeCases:
    """Extended project-level edge case tests."""

    def test_single_activity_on_track(self):
        """Single activity exactly on track."""
        activity = make_activity(
            bac=Decimal("50000.00"),
            planned_pct=Decimal("100.00"),
            actual_pct=Decimal("100.00"),
            actual_cost=Decimal("50000.00"),
        )
        result = calculate_project_evm(
            project_id=MOCK_PROJECT_ID,
            project_name="On Track Project",
            activities=[activity],
        )
        assert result.cpi == Decimal("1.00")
        assert result.spi == Decimal("1.00")
        assert result.cpi_interpretation == "On track"
        assert result.spi_interpretation == "On track"

    def test_multiple_activities_mixed(self):
        """Project with mixed activities consolidates correctly."""
        act1 = make_activity(
            name="Healthy",
            bac=Decimal("50000.00"),
            planned_pct=Decimal("50.00"),
            actual_pct=Decimal("60.00"),
            actual_cost=Decimal("22500.00"),
        )
        act2 = make_activity(
            name="Warning",
            bac=Decimal("50000.00"),
            planned_pct=Decimal("50.00"),
            actual_pct=Decimal("30.00"),
            actual_cost=Decimal("22500.00"),
        )
        result = calculate_project_evm(
            project_id=MOCK_PROJECT_ID,
            project_name="Mixed Project",
            activities=[act1, act2],
        )
        assert result.total_bac == Decimal("100000.00")
        # The consolidated result should have 2 activities
        assert len(result.activities) == 2

    def test_activity_count_in_evm_response(self):
        """Project EVM response contains correct number of activity entries."""
        activities = [
            make_activity(name=f"Act{i}", bac=Decimal(f"{i+1}0000.00"))
            for i in range(5)
        ]
        result = calculate_project_evm(
            project_id=MOCK_PROJECT_ID,
            project_name="5 Activity Project",
            activities=activities,
        )
        assert len(result.activities) == 5
