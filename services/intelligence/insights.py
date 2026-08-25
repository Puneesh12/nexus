"""
NEXUS — Proactive Insights Engine

Generates proactive alerts, deadline notices, and expiring item warnings
without requiring user prompting. Uses importance scoring.
"""
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any

import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.event import Event
from app.models.memory import Memory

logger = structlog.get_logger(__name__)


@dataclass
class ProactiveInsight:
    id: str
    type: str  # "deadline" | "expiration" | "renewal" | "travel" | "obligation"
    title: str
    description: str
    date_str: str | None
    importance: float
    source_filename: str | None
    recommended_action: str | None


class InsightsEngine:
    """
    Scans events and memory to produce prioritized insights for the user.
    """

    async def generate_insights(
        self,
        *,
        user_id: uuid.UUID,
        db: AsyncSession,
    ) -> list[dict[str, Any]]:
        """
        Generate list of active proactive insights.
        """
        # Fetch events ordered by importance and date
        stmt = (
            select(Event)
            .where(Event.user_id == user_id, Event.is_acknowledged == False)
            .order_by(Event.importance_score.desc(), Event.event_date.asc())
        )
        result = await db.execute(stmt)
        events = result.scalars().all()

        insights = []
        for ev in events:
            # Action recommendation based on event type
            action = None
            if ev.event_type == "expiration":
                action = "Review warranty terms or purchase extension"
            elif ev.event_type == "renewal":
                action = "Check payment method and renewal details"
            elif ev.event_type == "submission":
                action = "Review submission guidelines and complete draft"
            elif ev.event_type == "travel":
                action = "Check travel documents and web check-in"

            date_formatted = (
                ev.event_date.strftime("%B %d, %Y")
                if ev.event_date
                else "Upcoming"
            )

            source_fn = ev.provenance.get("filename") if ev.provenance else None

            insights.append({
                "id": str(ev.id),
                "type": ev.event_type,
                "title": ev.title,
                "description": ev.description or f"Event detected from {source_fn or 'documents'}.",
                "date": date_formatted,
                "importance": ev.importance_score,
                "source_filename": source_fn,
                "recommended_action": action,
            })

        logger.info("insights.generated", user_id=str(user_id), count=len(insights))
        return insights


# Singleton
insights_engine = InsightsEngine()
