"""
NEXUS — Embedding Service

Generates vector embeddings using OpenAI text-embedding-3-small.
Batches requests to minimize API cost.
Falls back to zero vectors in dev when OPENAI_API_KEY is not set.
"""
import structlog
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from app.core.config import settings

logger = structlog.get_logger(__name__)
BATCH_SIZE = 100


async def embed_chunks(texts: list[str]) -> list[list[float]]:
    """
    Embed a list of text chunks.
    Returns list of float vectors (same length as input).
    """
    if not texts:
        return []

    if not settings.OPENAI_API_KEY:
        logger.warning(
            "embedder.no_api_key",
            message="Returning zero vectors — set OPENAI_API_KEY in .env",
        )
        return [[0.0] * settings.OPENAI_EMBEDDING_DIMENSIONS for _ in texts]

    batches = [texts[i: i + BATCH_SIZE] for i in range(0, len(texts), BATCH_SIZE)]
    all_embeddings: list[list[float]] = []

    for batch_idx, batch in enumerate(batches):
        logger.debug("embedder.batch", batch_idx=batch_idx, size=len(batch))
        embeddings = await _embed_batch(batch)
        all_embeddings.extend(embeddings)

    return all_embeddings


async def embed_query(text: str) -> list[float]:
    """Embed a single query string for retrieval."""
    results = await embed_chunks([text])
    return results[0] if results else [0.0] * settings.OPENAI_EMBEDDING_DIMENSIONS


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=30),
    retry=retry_if_exception_type(Exception),
    reraise=True,
)
async def _embed_batch(texts: list[str]) -> list[list[float]]:
    """Embed one batch with retry on transient failure."""
    from openai import AsyncOpenAI

    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    response = await client.embeddings.create(
        model=settings.OPENAI_EMBEDDING_MODEL,
        input=texts,
        dimensions=settings.OPENAI_EMBEDDING_DIMENSIONS,
    )
    sorted_data = sorted(response.data, key=lambda x: x.index)
    return [item.embedding for item in sorted_data]
