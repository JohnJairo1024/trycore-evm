"""
Application configuration via environment variables / .env

Supports dual database mode:
  - PostgreSQL (asyncpg) — production: postgresql+asyncpg://user:pass@host/db
  - SQLite (aiosqlite) — development/testing: sqlite+aiosqlite:///evm.db
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Application
    APP_NAME: str = "EVM Dashboard API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Database
    # Default: SQLite for easy local dev; override with PostgreSQL for prod
    # PostgreSQL credentials must match docker-compose.yml (DBA config)
    DATABASE_URL: str = "sqlite+aiosqlite:///./evm.db"
    DATABASE_URL_SYNC: str = "sqlite:///./evm.db"
    # PostgreSQL connection (as defined in docker-compose.yml):
    # DATABASE_URL=postgresql+asyncpg://postgres:postgres123@localhost:5432/evm_database

    # CORS
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
    ]

    # Pagination defaults
    DEFAULT_PAGE_SIZE: int = 100
    MAX_PAGE_SIZE: int = 500

    # API
    API_V1_PREFIX: str = "/api/v1"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
