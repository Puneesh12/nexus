"""
NEXUS — Reranker Abstraction

Provides a pluggable reranking interface.
Currently supports:
- cross_encoder: local sentence-transformers cross-encoder (default)
- none: pass-through (returns input unchanged)
- cohere: Cohere Rerank API (requires COHERE_API_KEY)

The interface is:
  reranker.rerank(query, chunks, top_k) -> list[RetrievedChunk]
"""
from __future__ import annotations

from typing import TYPE_CHECKING
import structlog

from app.core.config import settings

if TYPE_CHECKING:
    from services.retrieval.retriever import RetrievedChunk

logger = structlog.get_logger(__name__)


class Reranker:
    """
    Reranks retrieved chunks against the query.
    Initialized once and reused.
    """

    def __init__(self) -> None:
        self._model = None
        self._type = settings.RERANKER_TYPE

    async def rerank(
        self,
        query: str,
        chunks: list[RetrievedChunk],
        top_k: int | None = None,
    ) -> list[RetrievedChunk]:
        """
        Rerank chunks by relevance to the query.
        Returns top_k chunks ordered by descending relevance.
        """
        k = top_k or settings.RERANKER_TOP_K

        if not chunks:
            return []

        if self._type == "none":
            return chunks[:k]

        if self._type == "cross_encoder":
            return await self._rerank_cross_encoder(query, chunks, k)

        if self._type == "cohere":
            return await self._rerank_cohere(query, chunks, k)

        # Fallback: return as-is
        return chunks[:k]

    async def _rerank_cross_encoder(
        self, query: str, chunks: list[RetrievedChunk], top_k: int
    ) -> list[RetrievedChunk]:
        """Rerank using a local cross-encoder (sentence-transformers)."""
        try:
            from sentence_transformers import CrossEncoder
            import asyncio
        except ImportError:
            logger.warning("reranker.cross_encoder_unavailable", falling_back="none")
            return chunks[:top_k]

        if self._model is None:
            # Load once (lazy)
            logger.info("reranker.loading_model", model="cross-encoder/ms-marco-MiniLM-L-6-v2")
            loop = asyncio.get_event_loop()
            self._model = await loop.run_in_executor(
                None,
                lambda: CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2"),
            )

        pairs = [(query, chunk.content) for chunk in chunks]
        loop = asyncio.get_event_loop()
        scores = await loop.run_in_executor(None, lambda: self._model.predict(pairs))

        scored = list(zip(chunks, scores))
        scored.sort(key=lambda x: x[1], reverse=True)

        result = []
        for chunk, score in scored[:top_k]:
            from dataclasses import replace
            result.append(
                RetrievedChunk(
                    chunk_id=chunk.chunk_id,
                    document_id=chunk.document_id,
                    content=chunk.content,
                    score=float(score),
                    filename=chunk.filename,
                    chunk_index=chunk.chunk_index,
                    metadata=chunk.metadata,
                    retrieval_method=chunk.retrieval_method,
                )
            )
        return result

    async def _rerank_cohere(
        self, query: str, chunks: list[RetrievedChunk], top_k: int
    ) -> list[RetrievedChunk]:
        """Rerank using Cohere Rerank API."""
        try:
            import cohere
        except ImportError:
            logger.warning("reranker.cohere_unavailable", falling_back="none")
            return chunks[:top_k]

        if not settings.COHERE_API_KEY:
            logger.warning("reranker.no_cohere_key", falling_back="none")
            return chunks[:top_k]

        client = cohere.AsyncClient(api_key=settings.COHERE_API_KEY)
        docs = [chunk.content for chunk in chunks]
        response = await client.rerank(
            model="rerank-english-v3.0",
            query=query,
            documents=docs,
            top_n=top_k,
        )

        result = []
        for item in response.results:
            chunk = chunks[item.index]
            result.append(
                RetrievedChunk(
                    chunk_id=chunk.chunk_id,
                    document_id=chunk.document_id,
                    content=chunk.content,
                    score=item.relevance_score,
                    filename=chunk.filename,
                    chunk_index=chunk.chunk_index,
                    metadata=chunk.metadata,
                    retrieval_method=chunk.retrieval_method,
                )
            )
        return result


# Singleton
reranker = Reranker()
