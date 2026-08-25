"""
NEXUS — Memory Model
Stores extracted facts about the user with provenance and confidence.
"""
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, JSON, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Memory(Base):
    """
    A structured fact extracted from user data with provenance tracking.
    Memory is NEVER silently inferred — it must have a source.

    Examples:
      - "User owns a MacBook Pro M3 (purchased June 2024)"
      - "User studies AI at VIT University"
      - "User has a Zomato Pro subscription renewing monthly"
    """

    __tablename__ = "memories"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    source_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sources.id", ondelete="SET NULL")
    )

    # The fact content (human-readable statement)
    content: Mapped[str] = mapped_column(Text, nullable=False)

    # Classification
    memory_type: Mapped[str] = mapped_column(
        String(64), nullable=False, index=True
    )  # ownership | education | subscription | preference | decision | attribute

    # Confidence: 0.0 (uncertain) to 1.0 (verified)
    confidence: Mapped[float] = mapped_column(Float, nullable=False, default=0.8)

    # Where this fact came from (chunk IDs, document IDs, extraction method)
    provenance: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)

    # Additional structured data for this memory
    attributes: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)

    # Whether this memory has been superseded by newer information
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False, index=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    def __repr__(self) -> str:
        return f"<Memory type={self.memory_type!r} confidence={self.confidence:.2f}>"
