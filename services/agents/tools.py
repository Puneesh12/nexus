"""
NEXUS — Agent Tools

Concrete, functional tools available to the Agent Orchestrator:
- search_documents: hybrid document search (pgvector + FTS)
- search_memory: query personal memories and facts
- search_events: query temporal events (deadlines, expirations, upcoming schedules)
- create_task: create action items / tasks for the user
"""
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any

import structlog
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.event import Event
from app.models.memory import Memory
from app.models.task import Task
from services.retrieval.retriever import RetrievedChunk, hybrid_retriever
from services.reranking.reranker import reranker

logger = structlog.get_logger(__name__)


@dataclass
class ToolResult:
    tool_name: str
    success: bool
    data: Any
    summary: str


class AgentTools:
    """Provides tools with DB execution contexts."""

    def __init__(self, db: AsyncSession, user_id: uuid.UUID):
        self.db = db
        self.user_id = user_id

    async def search_documents(self, query: str, limit: int = 5) -> ToolResult:
        """Search uploaded documents using hybrid retrieval and reranking."""
        chunks = await hybrid_retriever.retrieve(
            query=query,
            user_id=self.user_id,
            db=self.db,
        )
        ranked = await reranker.rerank(query=query, chunks=chunks, top_k=limit)
        return ToolResult(
            tool_name="search_documents",
            success=True,
            data=ranked,
            summary=f"Found {len(ranked)} relevant document excerpts.",
        )

    async def search_memory(self, query: str, limit: int = 5) -> ToolResult:
        """Search personal knowledge and facts."""
        stmt = (
            select(Memory)
            .where(Memory.user_id == self.user_id, Memory.is_active == True)
            .order_by(Memory.confidence.desc())
            .limit(limit)
        )
        res = await self.db.execute(stmt)
        memories = res.scalars().all()

        mem_list = [
            {"content": m.content, "type": m.memory_type, "confidence": m.confidence}
            for m in memories
        ]
        return ToolResult(
            tool_name="search_memory",
            success=True,
            data=mem_list,
            summary=f"Found {len(mem_list)} relevant personal memories.",
        )

    async def search_events(
        self,
        days_ahead: int = 30,
        event_type: str | None = None,
    ) -> ToolResult:
        """Search upcoming events, deadlines, and expirations."""
        stmt = (
            select(Event)
            .where(Event.user_id == self.user_id)
            .order_by(Event.importance_score.desc(), Event.event_date.asc())
        )
        if event_type:
            stmt = stmt.where(Event.event_type == event_type)

        res = await self.db.execute(stmt)
        events = res.scalars().all()

        event_list = [
            {
                "title": e.title,
                "event_type": e.event_type,
                "date": e.event_date.isoformat() if e.event_date else None,
                "importance": e.importance_score,
                "description": e.description,
            }
            for e in events
        ]
        return ToolResult(
            tool_name="search_events",
            success=True,
            data=event_list,
            summary=f"Found {len(event_list)} temporal events.",
        )

    async def create_task(
        self,
        title: str,
        description: str | None = None,
        priority: int = 3,
        due_date: datetime | None = None,
    ) -> ToolResult:
        """Create a user action item."""
        task = Task(
            user_id=self.user_id,
            title=title,
            description=description,
            priority=priority,
            due_date=due_date,
            status="pending",
        )
        self.db.add(task)
        await self.db.flush()
        return ToolResult(
            tool_name="create_task",
            success=True,
            data={"task_id": str(task.id), "title": task.title},
            summary=f"Created task: '{title}'",
        )
