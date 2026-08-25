"""
NEXUS — Query Route
Full Agentic RAG query endpoint: Hybrid Retrieval → Reranking → Grounded Generation
"""
import time
import structlog
from fastapi import APIRouter, HTTPException, status

from app.core.deps import CurrentUser, DBSession
from app.schemas.query import QueryRequest, QueryResponse
from services.retrieval.retriever import hybrid_retriever
from services.reranking.reranker import reranker
from services.intelligence.generator import generate_answer

logger = structlog.get_logger(__name__)
router = APIRouter()


@router.post("", response_model=QueryResponse)
async def query(
    payload: QueryRequest,
    current_user: CurrentUser,
    db: DBSession,
) -> dict:
    """
    Submit a natural language query to NEXUS.
    Executes Hybrid Retrieval (pgvector + FTS) → Reranking → Grounded Generation.
    """
    start_time = time.perf_counter()
    logger.info("query.start", query=payload.query[:100], user_id=str(current_user.id))

    # 1. Hybrid Retrieval
    t0 = time.perf_counter()
    retrieved_chunks = await hybrid_retriever.retrieve(
        query=payload.query,
        user_id=current_user.id,
        db=db,
    )
    retrieval_latency_ms = round((time.perf_counter() - t0) * 1000, 2)

    # 2. Reranking
    t1 = time.perf_counter()
    ranked_chunks = await reranker.rerank(
        query=payload.query,
        chunks=retrieved_chunks,
        top_k=payload.max_sources,
    )
    rerank_latency_ms = round((time.perf_counter() - t1) * 1000, 2)

    # 3. Grounded Generation
    t2 = time.perf_counter()
    gen_result = await generate_answer(
        query=payload.query,
        chunks=ranked_chunks,
    )
    generation_latency_ms = round((time.perf_counter() - t2) * 1000, 2)

    total_latency_ms = round((time.perf_counter() - start_time) * 1000, 2)

    execution_trace = {
        "retrieved_candidates": len(retrieved_chunks),
        "selected_chunks": len(ranked_chunks),
        "latencies_ms": {
            "retrieval": retrieval_latency_ms,
            "rerank": rerank_latency_ms,
            "generation": generation_latency_ms,
            "total": total_latency_ms,
        },
    }

    logger.info(
        "query.complete",
        total_latency_ms=total_latency_ms,
        sources_used=len(gen_result["citations"]),
    )

    return {
        "query": payload.query,
        "answer": gen_result["answer"],
        "sources": gen_result["sources"],
        "citations": gen_result["citations"],
        "execution_trace": execution_trace,
        "model": gen_result.get("model", "gpt-4o-mini"),
    }

