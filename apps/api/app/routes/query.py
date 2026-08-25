"""
NEXUS — Query Route
The main RAG query endpoint. Full implementation in Milestone 3.
"""
import structlog
from fastapi import APIRouter, HTTPException, status

from app.core.deps import CurrentUser, DBSession
from app.schemas.query import QueryRequest, QueryResponse

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

    The full RAG pipeline (hybrid retrieval → reranking → grounded generation → citations)
    is implemented in Milestone 3. This endpoint returns a placeholder response
    that correctly reflects the current state of the system.
    """
    logger.info("query.received", query=payload.query[:100], user_id=str(current_user.id))

    # TODO (Milestone 3): Invoke agent orchestrator
    # result = await agent_orchestrator.run(query=payload.query, user_id=current_user.id, db=db)

    return {
        "query": payload.query,
        "answer": "The query pipeline is being implemented. Document upload is available — try uploading documents in the Knowledge section first.",
        "sources": [],
        "citations": [],
        "execution_trace": None,
        "model": "pending",
    }
