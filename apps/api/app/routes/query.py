"""
NEXUS — Query Route
Agentic RAG query endpoint powered by the Agent Orchestrator.
"""
import structlog
from fastapi import APIRouter, HTTPException, status

from app.core.deps import CurrentUser, DBSession
from app.schemas.query import QueryRequest, QueryResponse
from services.agents.orchestrator import agent_orchestrator

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
    Routes to the Agent Orchestrator for intent detection, tool routing, and grounded reasoning.
    """
    return await agent_orchestrator.run(
        query=payload.query,
        user_id=current_user.id,
        db=db,
        max_sources=payload.max_sources,
    )

