"""
NEXUS — Event Model
Temporal events extracted from documents (deadlines, expirations, appointments, etc.)
"""
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, JSON, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Event(Base):
    __tablename__ = "events"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    source_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sources.id", ondelete="SET NULL"), index=True
    )
    document_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("documents.id", ondelete="SET NULL"), index=True
    )

    # Event classification
    event_type: Mapped[str] = mapped_column(
        String(64), nullable=False, index=True
    )  # deadline | expiration | appointment | renewal | payment | travel | submission

    title: Mapped[str] = mapped_column(String(512), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)

    # Temporal fields — all stored with timezone
    event_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), index=True)
    valid_from: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    valid_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), index=True)
    expiration_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), index=True)

    # Importance: 0.0 (low) to 1.0 (critical)
    importance_score: Mapped[float] = mapped_column(Float, default=0.5, nullable=False)

    # Whether user has been notified / dismissed
    is_acknowledged: Mapped[bool] = mapped_column(default=False, nullable=False)

    # Extracted context and provenance
    metadata_: Mapped[dict] = mapped_column("metadata", JSON, nullable=False, default=dict)
    provenance: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    def __repr__(self) -> str:
        return f"<Event type={self.event_type!r} title={self.title!r} date={self.event_date}>"
