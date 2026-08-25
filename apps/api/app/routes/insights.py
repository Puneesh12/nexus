"""
NEXUS — Insights Route
Proactive intelligence endpoint. Full implementation in Milestone 6.
"""
from datetime import datetime, timezone

import structlog
from fastapi import APIRouter

from app.core.deps import CurrentUser, DBSession

logger = structlog.get_logger(__name__)
router = APIRouter()


@router.get("")
async def get_insights(
    current_user: CurrentUser,
    db: DBSession,
) -> dict:
    """
    Return proactive insights for the current user.
    Full implementation in Milestone 6.
    """
    logger.info("insights.fetch", user_id=str(current_user.id))

    return {
        "insights": [],
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "message": "Upload documents to generate insights about deadlines, expirations, and upcoming events.",
    }
