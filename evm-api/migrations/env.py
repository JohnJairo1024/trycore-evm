"""
Alembic migrations environment configuration.

Uses the sync PostgreSQL URL from alembic.ini for migration operations.
Auto-generates migrations by comparing the database schema against
our SQLAlchemy models (Base.metadata).
"""

import sys
from logging.config import fileConfig
from pathlib import Path

from sqlalchemy import engine_from_config, pool
from alembic import context

# Add the project root to sys.path so Alembic can find our app module
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

# Import our models' Base metadata for autogenerate support
from app.core.database import Base
from app.models import Project, Activity  # noqa: F401 — needed for autogenerate

# Alembic Config object
config = context.config

# Set up logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Target metadata for autogenerate (all models registered on Base)
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode (generates SQL script without DB connection).

    Useful for generating migration SQL for DBA review before applying.
    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
        compare_server_default=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode (connects to live database).

    Uses sync engine from alembic.ini sqlalchemy.url.
    """
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
            compare_server_default=True,
        )

        with context.begin_transaction():
            context.run_migrations()

    connectable.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
