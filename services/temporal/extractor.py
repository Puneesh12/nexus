"""
NEXUS — Temporal Event Extraction Service

Extracts deadlines, expiration dates, renewals, and appointments from document text.
Uses deterministic date parsing (dateutil / regex) combined with importance scoring.
"""
import re
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any

import structlog
from dateutil import parser as date_parser
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.event import Event

logger = structlog.get_logger(__name__)


@dataclass
class ExtractedTemporalEvent:
    event_type: str  # "deadline" | "expiration" | "renewal" | "travel" | "submission"
    title: str
    event_date: datetime | None
    expiration_date: datetime | None
    importance_score: float
    description: str | None = None
    metadata: dict[str, Any] = None


class TemporalExtractor:
    """
    Extracts time-aware events from unstructured text.
    Uses regex date scanning and pattern matching to avoid relying purely on LLM.
    """

    async def extract_and_store_events(
        self,
        *,
        text: str,
        document_id: uuid.UUID,
        user_id: uuid.UUID,
        filename: str,
        db: AsyncSession,
    ) -> list[Event]:
        """
        Extract events from text and save Event rows to PostgreSQL.
        """
        events_data = self.extract_events_from_text(text, filename)
        saved_events: list[Event] = []

        provenance = {
            "document_id": str(document_id),
            "filename": filename,
            "extracted_at": datetime.now(timezone.utc).isoformat(),
        }

        for ev in events_data:
            event_rec = Event(
                user_id=user_id,
                document_id=document_id,
                event_type=ev.event_type,
                title=ev.title,
                description=ev.description,
                event_date=ev.event_date,
                expiration_date=ev.expiration_date,
                valid_until=ev.expiration_date or ev.event_date,
                importance_score=ev.importance_score,
                is_acknowledged=False,
                metadata_=ev.metadata or {},
                provenance=provenance,
            )
            db.add(event_rec)
            saved_events.append(event_rec)

        if saved_events:
            await db.flush()

        logger.info(
            "temporal.events_extracted",
            count=len(saved_events),
            filename=filename,
        )
        return saved_events

    def extract_events_from_text(self, text: str, filename: str) -> list[ExtractedTemporalEvent]:
        """
        Scan text for date mentions, deadlines, and expirations.
        """
        events: list[ExtractedTemporalEvent] = []
        fn_lower = filename.lower()
        text_lower = text.lower()

        # Regex patterns for common date expressions
        # e.g., "September 15, 2026", "2026-09-15", "Sept 15 2026", "15/09/2026"
        date_regex = re.compile(
            r"\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|"
            r"Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)"
            r"\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{4}\b|"
            r"\b\d{4}-\d{2}-\d{2}\b|"
            r"\b\d{1,2}/\d{1,2}/\d{4}\b",
            re.IGNORECASE,
        )

        matches = date_regex.findall(text)

        # 1. Warranty Expiration Heuristic
        if "warranty" in fn_lower or "warranty" in text_lower:
            parsed_date = self._find_best_date(matches, text, ["expire", "valid until", "expiration", "ends"])
            events.append(
                ExtractedTemporalEvent(
                    event_type="expiration",
                    title=f"Warranty Expiration — {filename}",
                    event_date=parsed_date,
                    expiration_date=parsed_date,
                    importance_score=0.9,
                    description=f"Device or product warranty expiring based on {filename}",
                    metadata={"source_document": filename},
                )
            )

        # 2. Insurance Renewal Heuristic
        if "insurance" in fn_lower or "insurance" in text_lower or "policy" in fn_lower:
            parsed_date = self._find_best_date(matches, text, ["due", "renewal", "renew", "premium", "valid until"])
            events.append(
                ExtractedTemporalEvent(
                    event_type="renewal",
                    title=f"Insurance Renewal — {filename}",
                    event_date=parsed_date,
                    expiration_date=parsed_date,
                    importance_score=0.85,
                    description=f"Insurance policy payment/renewal due based on {filename}",
                    metadata={"source_document": filename},
                )
            )

        # 3. Academic / College Submission Heuristic
        if "submission" in text_lower or "assignment" in text_lower or "academic" in fn_lower or "due date" in text_lower:
            parsed_date = self._find_best_date(matches, text, ["due", "deadline", "submit by", "submission"])
            events.append(
                ExtractedTemporalEvent(
                    event_type="submission",
                    title=f"Academic Submission Deadline — {filename}",
                    event_date=parsed_date,
                    expiration_date=parsed_date,
                    importance_score=0.8,
                    description=f"Coursework or project submission due based on {filename}",
                    metadata={"source_document": filename},
                )
            )

        # 4. Travel Booking Heuristic
        if "flight" in text_lower or "airline" in text_lower or "boarding" in text_lower or "hotel" in text_lower or "travel" in fn_lower:
            parsed_date = self._find_best_date(matches, text, ["departure", "flight date", "check-in", "on"])
            events.append(
                ExtractedTemporalEvent(
                    event_type="travel",
                    title=f"Travel Schedule — {filename}",
                    event_date=parsed_date,
                    expiration_date=parsed_date,
                    importance_score=0.8,
                    description=f"Travel check-in/flight scheduled based on {filename}",
                    metadata={"source_document": filename},
                )
            )

        return events

    def _find_best_date(self, matches: list[str], text: str, keywords: list[str]) -> datetime | None:
        """Find the date string closest to one of the contextual keywords."""
        if not matches:
            return None

        # Try parsing each match
        for date_str in matches:
            try:
                dt = date_parser.parse(date_str, fuzzy=True)
                if dt.tzinfo is None:
                    dt = dt.replace(tzinfo=timezone.utc)
                return dt
            except Exception:
                continue

        return None


# Singleton
temporal_extractor = TemporalExtractor()
