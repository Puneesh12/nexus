"""
NEXUS — Entity and Relationship Models
Powers the personal knowledge graph layer.
"""
import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, JSON, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Entity(Base):
    """
    A real-world entity extracted from documents.
    Examples: person, organization, product, location, event.
    """

    __tablename__ = "entities"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    source_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sources.id", ondelete="SET NULL")
    )

    # Classification
    entity_type: Mapped[str] = mapped_column(
        String(64), nullable=False, index=True
    )  # person | org | product | location | event | document | account | subscription

    name: Mapped[str] = mapped_column(String(512), nullable=False)
    normalized_name: Mapped[str] = mapped_column(
        String(512), nullable=False, index=True
    )  # lowercase, stripped for dedup

    # Flexible attributes (model, serial number, price, etc.)
    attributes: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)

    # Provenance — which chunk/document this came from
    provenance: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    outgoing_relations: Mapped[list["Relationship"]] = relationship(
        foreign_keys="Relationship.source_entity_id",
        back_populates="source_entity",
        lazy="select",
    )
    incoming_relations: Mapped[list["Relationship"]] = relationship(
        foreign_keys="Relationship.target_entity_id",
        back_populates="target_entity",
        lazy="select",
    )

    __table_args__ = (
        UniqueConstraint("user_id", "entity_type", "normalized_name", name="uq_entity_user_type_name"),
    )

    def __repr__(self) -> str:
        return f"<Entity type={self.entity_type!r} name={self.name!r}>"


class Relationship(Base):
    """
    A directed relationship between two entities.
    Examples: USER→OWNS→LAPTOP, LAPTOP→HAS_WARRANTY→WARRANTY_DOC
    """

    __tablename__ = "relationships"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    source_entity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("entities.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    target_entity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("entities.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    relation_type: Mapped[str] = mapped_column(
        String(128), nullable=False, index=True
    )  # OWNS | HAS_WARRANTY | STUDIES_AT | BOOKED | etc.

    attributes: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    provenance: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    confidence: Mapped[float] = mapped_column(default=1.0)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    source_entity: Mapped["Entity"] = relationship(
        foreign_keys=[source_entity_id], back_populates="outgoing_relations"
    )
    target_entity: Mapped["Entity"] = relationship(
        foreign_keys=[target_entity_id], back_populates="incoming_relations"
    )

    def __repr__(self) -> str:
        return f"<Relationship {self.source_entity_id}→{self.relation_type}→{self.target_entity_id}>"
