"""
NEXUS — Source Model
Represents an information source (local upload, Google Drive, Gmail, etc.)
"""
import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, JSON, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Source(Base):
    __tablename__ = "sources"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # Source classification
    type: Mapped[str] = mapped_column(
        String(64), nullable=False
    )  # "document" | "gmail" | "calendar" | "manual_note"
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    provider: Mapped[str | None] = mapped_column(String(64))  # "local" | "google" | "microsoft"
    external_id: Mapped[str | None] = mapped_column(String(512))  # ID in external system

    # Flexible metadata (file size, page count, connector-specific fields, etc.)
    metadata_: Mapped[dict] = mapped_column("metadata", JSON, nullable=False, default=dict)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship(back_populates="sources")  # type: ignore[name-defined]
    documents: Mapped[list["Document"]] = relationship(back_populates="source", lazy="select")  # type: ignore[name-defined]

    def __repr__(self) -> str:
        return f"<Source id={self.id} type={self.type!r} name={self.name!r}>"
