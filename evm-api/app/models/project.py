"""
Project ORM model.

Compatible with PostgreSQL (asyncpg) and SQLite (aiosqlite).

Schema matches init-db.sql (DBA specification):
  - projects: id UUID PK, name VARCHAR(255), description TEXT,
              created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
  - Index: idx_projects_created_at ON created_at DESC
  - Trigger: auto-update updated_at on UPDATE

Additional indexes from dba-performance-tuning.sql:
  - idx_projects_updated_at_desc ON updated_at DESC (sync queries)
"""

import uuid
from datetime import datetime

from sqlalchemy import String, Text, DateTime, func, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Project(Base):
    __tablename__ = "projects"

    __table_args__ = (
        # Core index: projects ordered by creation date (defined in init-db.sql)
        Index("idx_projects_created_at", "created_at"),
        # DBA recommendation: index for sync queries by updated_at
        Index("idx_projects_updated_at_desc", "updated_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
    )
    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
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

    # Relationship (CASCADE handled by DB via ON DELETE CASCADE in init-db.sql)
    activities: Mapped[list["Activity"]] = relationship(  # noqa: F821
        "Activity",
        back_populates="project",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    def __repr__(self) -> str:
        return f"<Project id={self.id} name='{self.name}'>"
