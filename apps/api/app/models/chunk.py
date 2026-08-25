"""
NEXUS — DocumentChunk Model
Stores individual text chunks with their vector embeddings.
pgvector is used for the embedding column.
"""
import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from pgvector.sqlalchemy import Vector
from sqlalchemy import DateTime, ForeignKey, Index, Integer, JSON, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.config import settings
from app.core.database import Base

if TYPE_CHECKING:
    from app.models.document import Document


class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    document_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("documents.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # Content
    content: Mapped[str] = mapped_column(Text, nullable=False)
    chunk_index: Mapped[int] = mapped_column(Integer, nullable=False)

    # Vector embedding (pgvector)
    embedding: Mapped[list[float] | None] = mapped_column(
        Vector(settings.OPENAI_EMBEDDING_DIMENSIONS)
    )

    # Metadata (page number, section, temporal info extracted from chunk, etc.)
    metadata_: Mapped[dict] = mapped_column("metadata", JSON, nullable=False, default=dict)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    document: Mapped["Document"] = relationship(back_populates="chunks")

    __table_args__ = (
        # Full-text search index
        Index(
            "ix_document_chunks_content_fts",
            func.to_tsvector("english", content),
            postgresql_using="gin",
        ),
        # IVFFlat index for vector similarity — built after initial data load
        # Index("ix_document_chunks_embedding_ivf", embedding, postgresql_using="ivfflat",
        #       postgresql_with={"lists": 100}, postgresql_ops={"embedding": "vector_cosine_ops"}),
    )

    def __repr__(self) -> str:
        return f"<DocumentChunk id={self.id} doc={self.document_id} idx={self.chunk_index}>"
