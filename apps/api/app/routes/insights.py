"""
NEXUS — Insights Route
Proactive intelligence endpoint returning deadlines, expirations, and obligations.
"""
from datetime import datetime, timezone

import structlog
from fastapi import APIRouter

from app.core.deps import CurrentUser, DBSession
from services.intelligence.insights import insights_engine

logger = structlog.get_logger(__name__)
router = APIRouter()


@router.get("")
async def get_insights(
    current_user: CurrentUser,
    db: DBSession,
) -> dict:
    """
    Return proactive insights for the current user.
    """
    insights_list = await insights_engine.generate_insights(
        user_id=current_user.id,
        db=db,
    )

    return {
        "insights": insights_list,
        "total": len(insights_list),
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "message": (
            f"Generated {len(insights_list)} active insights."
            if insights_list
            else "Upload documents to generate insights about deadlines, expirations, and upcoming events."
        ),
    }
