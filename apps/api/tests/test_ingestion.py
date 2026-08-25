"""
NEXUS — Document Parsing, Chunking and Ingestion Tests
"""
import pytest
from services.ingestion.parsers import parse_document, _clean_text
from services.ingestion.chunker import chunk_text
from services.ingestion.embedder import embed_chunks, embed_query


def test_clean_text():
    raw = "Hello   world!\x00\x08\n\n\n\nNew paragraph."
    cleaned = _clean_text(raw)
    assert "Hello world!" in cleaned
    assert "\x00" not in cleaned
    assert "\n\n" in cleaned


def test_parse_plain_text():
    sample_text = b"# Warranty Policy\n\nThis device has a 2-year warranty expiring on 2026-09-15."
    parsed = parse_document(
        file_data=sample_text,
        mime_type="text/plain",
        filename="warranty.txt",
    )
    assert "Warranty Policy" in parsed.text
    assert parsed.metadata["parser"] == "text"


def test_chunk_text():
    text = (
        "Paragraph 1. NEXUS is a privacy-first personal context engine.\n\n"
        "Paragraph 2. It connects emails, documents, calendars, and tasks into a unified memory.\n\n"
        "Paragraph 3. It utilizes hybrid search and agentic reasoning."
    )
    chunks = chunk_text(text=text, chunk_size=50, chunk_overlap=10)
    assert len(chunks) >= 1
    assert any("NEXUS" in c for c in chunks)


@pytest.mark.asyncio
async def test_embed_chunks_fallback():
    # Without OPENAI_API_KEY set, returns zero vector of dimension 1536
    chunks = ["Sample chunk 1", "Sample chunk 2"]
    embeddings = await embed_chunks(chunks)
    assert len(embeddings) == 2
    assert len(embeddings[0]) == 1536
