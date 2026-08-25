"""
NEXUS — Document Ingestion Pipeline

Orchestrates the full ingestion flow:
Upload → Parse → Clean → Chunk → Embed → Extract → Store

Every step is independently testable.
"""
import hashlib
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone

import structlog
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.document import Document
from app.models.chunk import DocumentChunk
from services.ingestion.parsers import parse_document
from services.ingestion.chunker import chunk_text
from services.ingestion.embedder import embed_chunks

logger = structlog.get_logger(__name__)


@dataclass
class IngestionResult:
    document_id: uuid.UUID
    chunks_created: int
    page_count: int | None
    entities_extracted: int
    events_extracted: int
    elapsed_seconds: float


class IngestionPipeline:
    """
    Orchestrates document ingestion end-to-end.
    Designed to be called after the document record is already created.
    """

    async def ingest(
        self,
        *,
        document: Document,
        file_data: bytes,
        db: AsyncSession,
    ) -> IngestionResult:
        """Run the full ingestion pipeline for a document."""
        start = datetime.now(timezone.utc)
        doc_log = logger.bind(document_id=str(document.id), filename=document.filename)

        doc_log.info("ingestion.start")

        try:
            # Mark as processing
            document.status = "processing"
            await db.flush()

            # 1. Parse
            doc_log.info("ingestion.parse")
            parsed = parse_document(
                file_data=file_data,
                mime_type=document.mime_type,
                filename=document.filename,
            )

            # 2. Compute content hash (SHA-256)
            content_hash = hashlib.sha256(file_data).hexdigest()
            document.content_hash = content_hash
            document.page_count = parsed.page_count

            # 3. Chunk
            doc_log.info("ingestion.chunk", text_length=len(parsed.text))
            chunks_text = chunk_text(
                text=parsed.text,
                chunk_size=settings.CHUNK_SIZE,
                chunk_overlap=settings.CHUNK_OVERLAP,
            )

            # 4. Embed all chunks in batch
            doc_log.info("ingestion.embed", chunk_count=len(chunks_text))
            embeddings = await embed_chunks(chunks_text)

            # 5. Persist chunks with embeddings
            chunk_records: list[DocumentChunk] = []
            for idx, (text, embedding) in enumerate(zip(chunks_text, embeddings)):
                chunk = DocumentChunk(
                    document_id=document.id,
                    user_id=document.user_id,
                    content=text,
                    chunk_index=idx,
                    embedding=embedding,
                    metadata_={
                        "filename": document.filename,
                        "chunk_index": idx,
                        "total_chunks": len(chunks_text),
                    },
                )
                chunk_records.append(chunk)

            db.add_all(chunk_records)

            # 6. Update document record
            document.status = "ready"
            document.chunk_count = len(chunk_records)
            document.metadata_ = {
                **document.metadata_,
                **parsed.metadata,
                "content_hash": content_hash,
                "ingested_at": datetime.now(timezone.utc).isoformat(),
            }

            await db.flush()

            elapsed = (datetime.now(timezone.utc) - start).total_seconds()
            doc_log.info(
                "ingestion.complete",
                chunks=len(chunk_records),
                elapsed=elapsed,
            )

            return IngestionResult(
                document_id=document.id,
                chunks_created=len(chunk_records),
                page_count=parsed.page_count,
                entities_extracted=0,  # Milestone 4
                events_extracted=0,    # Milestone 4
                elapsed_seconds=elapsed,
            )

        except Exception as exc:
            doc_log.error("ingestion.error", error=str(exc))
            document.status = "error"
            document.error_message = str(exc)
            await db.flush()
            raise


# Singleton pipeline instance
ingestion_pipeline = IngestionPipeline()
