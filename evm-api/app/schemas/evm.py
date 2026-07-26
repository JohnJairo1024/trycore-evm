"""
Pydantic schemas for EVM indicator responses.

All EVM indicators are CALCULATED in real-time by the EVM Calculator service.
They are NOT stored in the database.
"""

from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field


# ── Type aliases ─────────────────────────────────────────────────

EVMInterpretation = str
# Possible values:
#   - "Under budget"
#   - "Over budget"
#   - "On track"
#   - "Ahead of schedule"
#   - "Behind schedule"
#   - "No cost data"
#   - "No schedule data"
#   - "No activities"


# ── Activity-level EVM ───────────────────────────────────────────

class ActivityEVMResponse(BaseModel):
    """EVM indicators for a single activity."""
    activity_id: UUID
    activity_name: str
    bac: Decimal
    planned_percentage: Decimal
    actual_percentage: Decimal
    actual_cost: Decimal

    # Calculated indicators
    pv: Decimal = Field(..., description="Planned Value")
    ev: Decimal = Field(..., description="Earned Value")
    cv: Decimal = Field(..., description="Cost Variance (EV - AC)")
    sv: Decimal = Field(..., description="Schedule Variance (EV - PV)")
    cpi: Decimal = Field(..., description="Cost Performance Index (EV / AC)")
    spi: Decimal = Field(..., description="Schedule Performance Index (EV / PV)")
    eac: Decimal = Field(..., description="Estimate at Completion (BAC / CPI)")
    vac: Decimal = Field(..., description="Variance at Completion (BAC - EAC)")

    # Interpretations
    cpi_interpretation: EVMInterpretation = Field(
        ...,
        description="Human-readable CPI interpretation",
    )
    spi_interpretation: EVMInterpretation = Field(
        ...,
        description="Human-readable SPI interpretation",
    )


# ── Project-level EVM ────────────────────────────────────────────

class ProjectEVMResponse(BaseModel):
    """Consolidated EVM indicators for a project, including per-activity breakdown."""
    project_id: UUID
    project_name: str

    # Consolidated project-level indicators
    total_bac: Decimal
    total_actual_cost: Decimal
    total_pv: Decimal
    total_ev: Decimal
    cv: Decimal
    sv: Decimal
    cpi: Decimal
    spi: Decimal
    eac: Decimal
    vac: Decimal

    # Interpretations
    cpi_interpretation: EVMInterpretation
    spi_interpretation: EVMInterpretation

    # Per-activity breakdown
    activities: list[ActivityEVMResponse]
