"""
NEXUS — RAG, Hybrid Retrieval and Generation Unit Tests
"""
import uuid
import pytest
from services.retrieval.retriever import RetrievedChunk, HybridRetriever
from services.intelligence.generator import _extract_citations, _build_context_block, generate_answer


def test_build_context_block_and_delimiters():
    chunks = [
        RetrievedChunk(
            chunk_id=uuid.uuid4(),
            document_id=uuid.uuid4(),
            content="Your Dell XPS warranty expires on September 15, 2026.",
            score=0.95,
            filename="Warranty_Dell_XPS.pdf",
            chunk_index=0,
            metadata={},
            retrieval_method="hybrid",
        )
    ]
    block = _build_context_block(chunks)
    assert "[RETRIEVED DOCUMENTS]" in block
    assert "Warranty_Dell_XPS.pdf" in block
    assert "September 15, 2026" in block
    assert "[END RETRIEVED DOCUMENTS]" in block


def test_extract_citations():
    chunks = [
        RetrievedChunk(
            chunk_id=uuid.uuid4(),
            document_id=uuid.uuid4(),
            content="Insurance renewal due on Oct 10.",
            score=0.9,
            filename="Auto_Insurance.pdf",
            chunk_index=0,
            metadata={},
            retrieval_method="vector",
        )
    ]
    answer = "Based on Auto_Insurance.pdf, your insurance is due on Oct 10."
    citations = _extract_citations(answer, chunks)
    assert "Auto_Insurance.pdf" in citations


def test_rrf_merge():
    retriever = HybridRetriever()
    cid1, cid2, doc_id = uuid.uuid4(), uuid.uuid4(), uuid.uuid4()
    
    vec_chunk = RetrievedChunk(
        chunk_id=cid1,
        document_id=doc_id,
        content="Vector content",
        score=0.88,
        filename="doc1.pdf",
        chunk_index=0,
        metadata={},
        retrieval_method="vector",
    )
    ft_chunk = RetrievedChunk(
        chunk_id=cid2,
        document_id=doc_id,
        content="Fulltext content",
        score=0.75,
        filename="doc2.pdf",
        chunk_index=0,
        metadata={},
        retrieval_method="fulltext",
    )
    
    merged = retriever._rrf_merge([vec_chunk], [ft_chunk])
    assert len(merged) == 2
    assert merged[0].score > 0
