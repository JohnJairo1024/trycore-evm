"""
Activity ORM model.

Compatible with PostgreSQL (asyncpg) and SQLite (aiosqlite).

Schema matches init-db.sql (DBA specification) with exact CHECK constraints,
foreign keys, and indexes. Additional indexes follow the DBA performance
tuning guide (dba-performance-tuning.sql).
"""

import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    String,
    Numeric,
    DateTime,
    ForeignKey,
    func,
    text,
    CheckConstraint,
    Index,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Activity(Base):
    __tablename__ = "activities"

    __table_args__ = (
        # CHECK constraints (exact match with init-db.sql)
        CheckConstraint("bac > 0", name="ck_activity_bac_positive"),
        CheckConstraint(
            "planned_percentage >= 0 AND planned_percentage <= 100",
            name="ck_activity_planned_pct_range",
        ),
        CheckConstraint(
            "actual_percentage >= 0 AND actual_percentage <= 100",
            name="ck_activity_actual_pct_range",
        ),
        CheckConstraint("actual_cost >= 0", name="ck_activity_actual_cost_positive"),
        # Core index for FK lookups (defined in init-db.sql)
        Index("idx_activities_project_id", "project_id"),
        # DBA recommendation: composite index for the most frequent query pattern
        # (list activities by project ordered by creation date)
        Index(
            "idx_activities_project_created",
            "project_id",
            "created_at",
            postgresql_using="btree",
        ),
        # DBA recommendation: covering index for EVM calculations
        # Avoids table lookups when calculating EVM indicators
        Index(
            "idx_activities_evm_calc",
            "project_id",
            postgresql_include={"bac", "actual_percentage", "planned_percentage", "actual_cost"},
        ),
        # DBA recommendation: partial index for delayed activities
        # Only indexes rows where actual < planned (common filter)
        # PostgreSQL-specific — skipped on SQLite
        Index(
            "idx_activities_delayed",
            "project_id",
            postgresql_where=text("actual_percentage < planned_percentage"),
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        index=False,  # index=False because we define it manually above
    )
    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    bac: Mapped[Decimal] = mapped_column(
        Numeric(15, 2),
        nullable=False,
    )
    planned_percentage: Mapped[Decimal] = mapped_column(
        Numeric(5, 2),
        nullable=False,
    )
    actual_percentage: Mapped[Decimal] = mapped_column(
        Numeric(5, 2),
        nullable=False,
    )
    actual_cost: Mapped[Decimal] = mapped_column(
        Numeric(15, 2),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    # Relationship
    project: Mapped["Project"] = relationship(  # noqa: F821
        "Project",
        back_populates="activities",
    )

    def __repr__(self) -> str:
        return f"<Activity id={self.id} name='{self.name}' bac={self.bac}>"
