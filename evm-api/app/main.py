"""
EVM Dashboard API — FastAPI Application Entry Point.

Stack:
    - Python 3.13+ / FastAPI 0.115+
    - PostgreSQL 16+ / SQLAlchemy 2.0 (async) / asyncpg
    - Pydantic 2.x for validation
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import init_db, close_db
from app.api.v1 import projects as projects_router
from app.api.v1 import activities as activities_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: initialize and tear down resources."""
    # Startup
    await init_db()
    yield
    # Shutdown
    await close_db()


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Earned Value Management (EVM) Dashboard API — "
    "Track project performance with EVM indicators.",
    docs_url="/api-docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ── Middleware ────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────

app.include_router(projects_router.router, prefix=settings.API_V1_PREFIX)
app.include_router(activities_router.router, prefix=settings.API_V1_PREFIX)


# ── Health Check ──────────────────────────────────────────────────

@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint — used by monitoring / k8s probes."""
    return {
        "status": "healthy",
        "version": settings.APP_VERSION,
        "database": "connected",
    }
