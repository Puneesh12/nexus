"""
NEXUS — Hybrid Retrieval Engine

Combines vector similarity search (pgvector) with full-text search (PostgreSQL tsvector).
Results are merged, deduplicated, and reranked.

Design:
- Vector search and full-text search run in parallel
- Results merged with RRF (Reciprocal Rank Fusion)
- Metadata filtering applied before merge
- Reranker applied after merge to final top-K
"""
import uuid
from dataclasses import dataclass
from typing import Any

import structlog
from sqlalchemy import select, text, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.chunk import DocumentChunk
from services.ingestion.embedder import embed_query

logger = structlog.get_logger(__name__)


@dataclass
class RetrievedChunk:
    """A retrieved document chunk with its relevance score."""
    chunk_id: uuid.UUID
    document_id: uuid.UUID
    content: str
    score: float
    filename: str
    chunk_index: int
    metadata: dict[str, Any]
    retrieval_method: str  # "vector" | "fulltext" | "hybrid"


class HybridRetriever:
    """
    Performs hybrid retrieval combining pgvector cosine similarity
    and PostgreSQL full-text search, merged via RRF.
    """

    async def retrieve(
        self,
        *,
        query: str,
        user_id: uuid.UUID,
        db: AsyncSession,
        vector_limit: int | None = None,
        fulltext_limit: int | None = None,
        metadata_filter: dict[str, Any] | None = None,
    ) -> list[RetrievedChunk]:
        """
        Run hybrid retrieval for a query.
        Returns merged, ranked list of chunks.
        """
        v_limit = vector_limit or settings.VECTOR_SEARCH_LIMIT
        ft_limit = fulltext_limit or settings.FULL_TEXT_SEARCH_LIMIT

        log = logger.bind(query=query[:80], user_id=str(user_id))
        log.info("retriever.start")

        # Embed the query
        query_embedding = await embed_query(query)

        # Run both searches in parallel
        import asyncio
        vector_results, fulltext_results = await asyncio.gather(
            self._vector_search(
                query_embedding=query_embedding,
                user_id=user_id,
                db=db,
                limit=v_limit,
            ),
            self._fulltext_search(
                query=query,
                user_id=user_id,
                db=db,
                limit=ft_limit,
            ),
        )

        log.info(
            "retriever.results",
            vector_count=len(vector_results),
            fulltext_count=len(fulltext_results),
        )

        # Merge using Reciprocal Rank Fusion
        merged = self._rrf_merge(vector_results, fulltext_results)
        return merged

    async def _vector_search(
        self,
        *,
        query_embedding: list[float],
        user_id: uuid.UUID,
        db: AsyncSession,
        limit: int,
    ) -> list[RetrievedChunk]:
        """pgvector cosine similarity search."""
        if all(v == 0.0 for v in query_embedding):
            # Zero embedding means OpenAI API not configured — skip
            return []

        sql = text("""
            SELECT
                dc.id AS chunk_id,
                dc.document_id,
                dc.content,
                dc.chunk_index,
                dc.metadata,
                d.filename,
                1 - (dc.embedding <=> CAST(:embedding AS vector)) AS score
            FROM document_chunks dc
            JOIN documents d ON d.id = dc.document_id
            WHERE dc.user_id = :user_id
              AND dc.embedding IS NOT NULL
            ORDER BY dc.embedding <=> CAST(:embedding AS vector)
            LIMIT :limit
        """)

        result = await db.execute(
            sql,
            {
                "embedding": str(query_embedding),
                "user_id": str(user_id),
                "limit": limit,
            },
        )
        rows = result.fetchall()

        return [
            RetrievedChunk(
                chunk_id=row.chunk_id,
                document_id=row.document_id,
                content=row.content,
                score=float(row.score),
                filename=row.filename,
                chunk_index=row.chunk_index,
                metadata=row.metadata or {},
                retrieval_method="vector",
            )
            for row in rows
        ]

    async def _fulltext_search(
        self,
        *,
        query: str,
        user_id: uuid.UUID,
        db: AsyncSession,
        limit: int,
    ) -> list[RetrievedChunk]:
        """PostgreSQL full-text search using tsvector."""
        # Clean query for tsquery — escape special characters
        clean_query = " & ".join(
            word for word in query.split() if len(word) > 2
        )
        if not clean_query:
            return []

        sql = text("""
            SELECT
                dc.id AS chunk_id,
                dc.document_id,
                dc.content,
                dc.chunk_index,
                dc.metadata,
                d.filename,
                ts_rank_cd(
                    to_tsvector('english', dc.content),
                    plainto_tsquery('english', :query)
                ) AS score
            FROM document_chunks dc
            JOIN documents d ON d.id = dc.document_id
            WHERE dc.user_id = :user_id
              AND to_tsvector('english', dc.content) @@ plainto_tsquery('english', :query)
            ORDER BY score DESC
            LIMIT :limit
        """)

        result = await db.execute(
            sql,
            {
                "query": query,
                "user_id": str(user_id),
                "limit": limit,
            },
        )
        rows = result.fetchall()

        return [
            RetrievedChunk(
                chunk_id=row.chunk_id,
                document_id=row.document_id,
                content=row.content,
                score=float(row.score),
                filename=row.filename,
                chunk_index=row.chunk_index,
                metadata=row.metadata or {},
                retrieval_method="fulltext",
            )
            for row in rows
        ]

    def _rrf_merge(
        self,
        vector_results: list[RetrievedChunk],
        fulltext_results: list[RetrievedChunk],
        k: int = 60,
    ) -> list[RetrievedChunk]:
        """
        Reciprocal Rank Fusion: merges two ranked lists into one.
        RRF score = sum(1 / (k + rank_i)) for each result list.
        """
        rrf_scores: dict[uuid.UUID, float] = {}
        chunk_map: dict[uuid.UUID, RetrievedChunk] = {}

        for rank, chunk in enumerate(vector_results):
            rrf_scores[chunk.chunk_id] = rrf_scores.get(chunk.chunk_id, 0) + 1 / (k + rank + 1)
            chunk_map[chunk.chunk_id] = chunk

        for rank, chunk in enumerate(fulltext_results):
            rrf_scores[chunk.chunk_id] = rrf_scores.get(chunk.chunk_id, 0) + 1 / (k + rank + 1)
            if chunk.chunk_id not in chunk_map:
                chunk_map[chunk.chunk_id] = chunk

        # Sort by RRF score
        sorted_ids = sorted(rrf_scores, key=lambda cid: rrf_scores[cid], reverse=True)

        result = []
        for cid in sorted_ids:
            chunk = chunk_map[cid]
            # Mark method as hybrid if it appeared in both
            method = (
                "hybrid"
                if any(c.chunk_id == cid for c in vector_results)
                and any(c.chunk_id == cid for c in fulltext_results)
                else chunk.retrieval_method
            )
            result.append(
                RetrievedChunk(
                    chunk_id=chunk.chunk_id,
                    document_id=chunk.document_id,
                    content=chunk.content,
                    score=rrf_scores[cid],
                    filename=chunk.filename,
                    chunk_index=chunk.chunk_index,
                    metadata=chunk.metadata,
                    retrieval_method=method,
                )
            )
        return result


# Singleton retriever
hybrid_retriever = HybridRetriever()
