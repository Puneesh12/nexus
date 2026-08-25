"""
NEXUS — Health Check Route
"""
from datetime import datetime, timezone

from fastapi import APIRouter
from sqlalchemy import text

from app.core.database import get_engine

router = APIRouter(tags=["system"])


@router.get("/health")
async def health_check() -> dict:
    """System health check — verifies API and database connectivity."""
    db_status = "unknown"
    try:
        engine = get_engine()
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT 1"))
            result.fetchone()
        db_status = "ok"
    except Exception as exc:
        db_status = f"error: {type(exc).__name__}"

    return {
        "status": "ok" if db_status == "ok" else "degraded",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": "0.1.0",
        "services": {
            "api": "ok",
            "database": db_status,
        },
    }


@router.get("/")
async def root() -> dict:
    return {"product": "NEXUS", "tagline": "Personal Context Engine", "version": "0.1.0"}
