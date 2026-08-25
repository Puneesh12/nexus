"""
NEXUS — Query Schemas (Pydantic v2)
"""
from typing import Any

from pydantic import BaseModel, Field


class QueryRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=4000)
    max_sources: int = Field(default=5, ge=1, le=20)


class CitationSource(BaseModel):
    document_id: str
    filename: str
    excerpt: str
    chunk_index: int | None = None
    relevance_score: float | None = None


class QueryResponse(BaseModel):
    query: str
    answer: str
    sources: list[CitationSource]
    citations: list[str]
    execution_trace: dict[str, Any] | None = None
    model: str | None = None
