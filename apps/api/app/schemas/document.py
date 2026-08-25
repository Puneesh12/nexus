"""
NEXUS — Document Schemas (Pydantic v2)
"""
import uuid
from datetime import datetime

from pydantic import BaseModel


class DocumentResponse(BaseModel):
    id: uuid.UUID
    filename: str
    mime_type: str
    file_size_bytes: int | None
    status: str
    chunk_count: int | None
    page_count: int | None
    created_at: datetime

    model_config = {"from_attributes": True}


class DocumentListResponse(BaseModel):
    documents: list[DocumentResponse]
    total: int
