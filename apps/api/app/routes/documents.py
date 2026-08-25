"""
NEXUS — Document Routes
Upload, list, and retrieve documents.
Full ingestion pipeline wired for Milestone 2.
"""
import uuid
from typing import Any

import structlog
from fastapi import APIRouter, BackgroundTasks, HTTPException, UploadFile, File, status
from sqlalchemy import select

from app.core.config import settings
from app.core.deps import CurrentUser, DBSession
from app.models.document import Document
from app.models.source import Source
from app.schemas.document import DocumentListResponse, DocumentResponse
from services.ingestion.pipeline import ingestion_pipeline

logger = structlog.get_logger(__name__)
router = APIRouter()


@router.get("", response_model=DocumentListResponse)
async def list_documents(
    current_user: CurrentUser,
    db: DBSession,
    limit: int = 50,
    offset: int = 0,
) -> dict:
    """List all documents for the current user."""
    result = await db.execute(
        select(Document)
        .where(Document.user_id == current_user.id)
        .order_by(Document.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    documents = result.scalars().all()
    return {"documents": documents, "total": len(documents)}


@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_202_ACCEPTED)
async def upload_document(
    current_user: CurrentUser,
    db: DBSession,
    file: UploadFile = File(...),
) -> Document:
    """
    Upload a document for ingestion.
    Validates MIME type & size, creates records, and runs the ingestion pipeline.
    """
    # Validate file size
    file_data = await file.read()
    if len(file_data) > settings.max_upload_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum size of {settings.MAX_UPLOAD_SIZE_MB}MB.",
        )

    # Validate MIME type
    content_type = file.content_type or ""
    if content_type not in settings.ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"File type '{content_type}' is not supported. "
                   f"Supported types: PDF, DOCX, TXT, Markdown.",
        )

    # Create source record
    source = Source(
        user_id=current_user.id,
        type="document",
        name=file.filename or "Untitled",
        provider="local",
        metadata_={"original_filename": file.filename, "content_type": content_type},
    )
    db.add(source)
    await db.flush()

    # Create document record
    document = Document(
        user_id=current_user.id,
        source_id=source.id,
        filename=file.filename or "Untitled",
        mime_type=content_type,
        file_size_bytes=len(file_data),
        status="pending",
        metadata_={},
    )
    db.add(document)
    await db.flush()
    await db.refresh(document)

    logger.info(
        "document.upload",
        document_id=str(document.id),
        filename=file.filename,
        size=len(file_data),
        user_id=str(current_user.id),
    )

    # Execute ingestion pipeline
    await ingestion_pipeline.ingest(
        document=document,
        file_data=file_data,
        db=db,
    )

    return document


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: uuid.UUID,
    current_user: CurrentUser,
    db: DBSession,
) -> Document:
    """Retrieve a specific document."""
    result = await db.execute(
        select(Document).where(
            Document.id == document_id,
            Document.user_id == current_user.id,
        )
    )
    document = result.scalar_one_or_none()
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")
    return document


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    document_id: uuid.UUID,
    current_user: CurrentUser,
    db: DBSession,
) -> None:
    """Delete a document and all its chunks."""
    result = await db.execute(
        select(Document).where(
            Document.id == document_id,
            Document.user_id == current_user.id,
        )
    )
    document = result.scalar_one_or_none()
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")

    await db.delete(document)
    logger.info("document.delete", document_id=str(document_id), user_id=str(current_user.id))
