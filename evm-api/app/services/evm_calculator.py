"""
EVM Calculator — Core business logic for Earned Value Management.

All EVM indicators are calculated here in real-time.
This is the most critical service in the application.

ADR-001: All EVM calculations live in the Backend.
ADR-002: Indicators are NOT stored in the database — calculated on-the-fly.
"""

import uuid
from decimal import Decimal
from typing import Sequence

from app.models.activity import Activity
from app.schemas.evm import (
    ActivityEVMResponse,
    EVMInterpretation,
    ProjectEVMResponse,
)

# ── Constants ────────────────────────────────────────────────────

ZERO = Decimal("0")
HUNDRED = Decimal("100")

CPI_INTERPRETATIONS: dict[str, EVMInterpretation] = {
    "healthy": "Under budget",
    "warning": "Over budget",
    "on_track": "On track",
    "no_cost": "No cost data",
    "no_activities": "No activities",
}

SPI_INTERPRETATIONS: dict[str, EVMInterpretation] = {
    "healthy": "Ahead of schedule",
    "warning": "Behind schedule",
    "on_track": "On track",
    "no_schedule": "No schedule data",
    "no_activities": "No activities",
}


# ── Helpers ──────────────────────────────────────────────────────

DECIMAL_PLACES = Decimal("0.01")


def _round(value: Decimal) -> Decimal:
    """Round a Decimal value to 2 decimal places (standard for currency)."""
    return value.quantize(DECIMAL_PLACES)


def _safe_divide(numerator: Decimal, denominator: Decimal) -> Decimal:
    """Divide and round, returning ZERO if denominator is zero (avoid div by zero)."""
    return _round(numerator / denominator) if denominator > ZERO else ZERO


def _compute_evm_metrics(
    bac: Decimal, ev: Decimal, ac: Decimal, pv: Decimal
) -> tuple[Decimal, Decimal, Decimal, Decimal, Decimal, Decimal]:
    """Compute the 6 core EVM indicators from the 4 base values.

    Returns (cv, sv, cpi, spi, eac, vac).
    """
    cv = _round(ev - ac)
    sv = _round(ev - pv)
    cpi = _safe_divide(ev, ac)
    spi = _safe_divide(ev, pv)
    eac = _safe_divide(bac, cpi)
    vac = _round(bac - eac)
    return cv, sv, cpi, spi, eac, vac


def _interpret_cpi(cpi: Decimal, total_ac: Decimal) -> EVMInterpretation:
    """Determine the human-readable interpretation of a CPI value."""
    if total_ac == ZERO:
        return CPI_INTERPRETATIONS["no_cost"]
    if cpi > Decimal("1"):
        return CPI_INTERPRETATIONS["healthy"]
    if cpi == Decimal("1"):
        return CPI_INTERPRETATIONS["on_track"]
    return CPI_INTERPRETATIONS["warning"]


def _interpret_spi(spi: Decimal, total_pv: Decimal) -> EVMInterpretation:
    """Determine the human-readable interpretation of an SPI value."""
    if total_pv == ZERO:
        return SPI_INTERPRETATIONS["no_schedule"]
    if spi > Decimal("1"):
        return SPI_INTERPRETATIONS["healthy"]
    if spi == Decimal("1"):
        return SPI_INTERPRETATIONS["on_track"]
    return SPI_INTERPRETATIONS["warning"]


# ── Per-Activity Calculations ────────────────────────────────────

def calculate_activity_evm(activity: Activity) -> ActivityEVMResponse:
    """
    Calculate all EVM indicators for a single activity.

    Formulas:
        PV  = BAC × planned_percentage / 100
        EV  = BAC × actual_percentage / 100
        CV  = EV - AC
        SV  = EV - PV
        CPI = EV / AC   (0 if AC == 0)
        SPI = EV / PV   (0 if PV == 0)
        EAC = BAC / CPI (0 if CPI == 0)
        VAC = BAC - EAC
    """
    bac = activity.bac
    planned_pct = activity.planned_percentage
    actual_pct = activity.actual_percentage
    ac = activity.actual_cost

    # Basic calculations
    pv = _round(bac * planned_pct / HUNDRED)
    ev = _round(bac * actual_pct / HUNDRED)

    # Core EVM indicators (CV, SV, CPI, SPI, EAC, VAC)
    cv, sv, cpi, spi, eac, vac = _compute_evm_metrics(bac, ev, ac, pv)

    return ActivityEVMResponse(
        activity_id=activity.id,
        activity_name=activity.name,
        bac=bac,
        planned_percentage=planned_pct,
        actual_percentage=actual_pct,
        actual_cost=ac,
        pv=pv,
        ev=ev,
        cv=cv,
        sv=sv,
        cpi=cpi,
        spi=spi,
        eac=eac,
        vac=vac,
        cpi_interpretation=_interpret_cpi(cpi, ac),
        spi_interpretation=_interpret_spi(spi, pv),
    )


# ── Project-Level Consolidation ──────────────────────────────────

def calculate_project_evm(
    project_id: uuid.UUID,
    project_name: str,
    activities: Sequence[Activity],
) -> ProjectEVMResponse:
    """
    Calculate consolidated EVM indicators for an entire project.

    Consolidation is done by summing individual activity values
    and then computing project-level CPI/SPI from the totals.
    """
    if not activities:
        return ProjectEVMResponse(
            project_id=project_id,
            project_name=project_name,
            total_bac=ZERO,
            total_actual_cost=ZERO,
            total_pv=ZERO,
            total_ev=ZERO,
            cv=ZERO,
            sv=ZERO,
            cpi=ZERO,
            spi=ZERO,
            eac=ZERO,
            vac=ZERO,
            cpi_interpretation=CPI_INTERPRETATIONS["no_activities"],
            spi_interpretation=SPI_INTERPRETATIONS["no_activities"],
            activities=[],
        )

    # Calculate per-activity EVM first
    activity_evm_list = [calculate_activity_evm(a) for a in activities]

    # Consolidate: sum totals (Decimal sum with start value)
    total_bac = sum((a.bac for a in activities), ZERO)
    total_ac = sum((a.actual_cost for a in activities), ZERO)
    total_pv = sum((a.pv for a in activity_evm_list), ZERO)
    total_ev = sum((a.ev for a in activity_evm_list), ZERO)

    # Project-level indicators (calculated from consolidated totals)
    cv, sv, cpi, spi, eac, vac = _compute_evm_metrics(total_bac, total_ev, total_ac, total_pv)

    return ProjectEVMResponse(
        project_id=project_id,
        project_name=project_name,
        total_bac=_round(total_bac),
        total_actual_cost=_round(total_ac),
        total_pv=_round(total_pv),
        total_ev=_round(total_ev),
        cv=cv,
        sv=sv,
        cpi=cpi,
        spi=spi,
        eac=eac,
        vac=vac,
        cpi_interpretation=_interpret_cpi(cpi, total_ac),
        spi_interpretation=_interpret_spi(spi, total_pv),
        activities=activity_evm_list,
    )
