"""
NEXUS — Agent Orchestrator

Manages query understanding, tool selection, multi-source retrieval,
grounded reasoning, and hallucination validation.
"""
import time
import uuid
from typing import Any

import structlog
from sqlalchemy.ext.asyncio import AsyncSession

from services.agents.tools import AgentTools, ToolResult
from services.intelligence.generator import generate_answer

logger = structlog.get_logger(__name__)


class AgentOrchestrator:
    """
    Orchestrates agentic workflows across documents, memory, events, and tasks.
    """

    async def run(
        self,
        *,
        query: str,
        user_id: uuid.UUID,
        db: AsyncSession,
        max_sources: int = 5,
    ) -> dict[str, Any]:
        """
        Execute an agentic workflow for the given query.
        """
        start_time = time.perf_counter()
        tools = AgentTools(db=db, user_id=user_id)
        trace_log = logger.bind(query=query[:80], user_id=str(user_id))

        trace_log.info("agent.start")

        # 1. Intent Detection
        intent = self._detect_intent(query)
        trace_log.info("agent.intent", intent=intent)

        selected_tools = []
        context_chunks = []
        extra_context = []

        # 2. Tool Execution based on Intent
        if intent in ("temporal_summary", "events", "all"):
            selected_tools.append("search_events")
            event_res = await tools.search_events(days_ahead=30)
            if event_res.data:
                extra_context.append(f"Upcoming Events & Deadlines:\n{event_res.data}")

        if intent in ("factual", "document", "all", "temporal_summary"):
            selected_tools.append("search_documents")
            doc_res = await tools.search_documents(query=query, limit=max_sources)
            if doc_res.data:
                context_chunks.extend(doc_res.data)

        if intent in ("personal_fact", "all"):
            selected_tools.append("search_memory")
            mem_res = await tools.search_memory(query=query)
            if mem_res.data:
                extra_context.append(f"Personal Facts:\n{mem_res.data}")

        # 3. Grounded Synthesis
        gen_result = await generate_answer(
            query=query,
            chunks=context_chunks,
        )

        total_latency_ms = round((time.perf_counter() - start_time) * 1000, 2)

        execution_trace = {
            "intent": intent,
            "selected_tools": selected_tools,
            "retrieved_candidates": len(context_chunks),
            "latency_ms": total_latency_ms,
        }

        trace_log.info(
            "agent.complete",
            intent=intent,
            tools_used=selected_tools,
            total_latency_ms=total_latency_ms,
        )

        return {
            "query": query,
            "answer": gen_result["answer"],
            "sources": gen_result["sources"],
            "citations": gen_result["citations"],
            "execution_trace": execution_trace,
            "model": gen_result.get("model", "gpt-4o-mini"),
        }

    def _detect_intent(self, query: str) -> str:
        """
        Classify query intent deterministically using keywords and query structure.
        """
        q_lower = query.lower()

        if any(w in q_lower for w in ["next 30 days", "upcoming", "deadline", "expire", "due", "take care of", "schedule"]):
            return "temporal_summary"
        elif any(w in q_lower for w in ["who am i", "where do i study", "what do i own", "my preferences"]):
            return "personal_fact"
        elif any(w in q_lower for w in ["document", "file", "invoice", "receipt", "pdf", "policy"]):
            return "document"
        else:
            return "all"


# Singleton
agent_orchestrator = AgentOrchestrator()
