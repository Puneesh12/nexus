"""
NEXUS — Text Chunker
Token-aware recursive chunking using LangChain text splitters.

Respects sentence and paragraph boundaries. Uses tiktoken for
accurate token counting against the embedding model.
"""


def chunk_text(
    *,
    text: str,
    chunk_size: int = 512,
    chunk_overlap: int = 128,
) -> list[str]:
    """
    Split text into overlapping chunks for embedding.

    Returns a list of text chunks. Empty text returns an empty list.
    Adjacent chunks share overlap so that retrieval can find context
    that spans chunk boundaries.
    """
    if not text.strip():
        return []

    try:
        from langchain_text_splitters import RecursiveCharacterTextSplitter
        import tiktoken
    except ImportError:
        raise ImportError(
            "langchain-text-splitters and tiktoken are required."
        )

    try:
        enc = tiktoken.encoding_for_model("gpt-4o-mini")

        def token_length(s: str) -> int:
            return len(enc.encode(s))

        splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            length_function=token_length,
            separators=["\n\n", "\n", ". ", "! ", "? ", ", ", " ", ""],
        )
    except Exception:
        # Fallback to character-based splitting (~4 chars/token)
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size * 4,
            chunk_overlap=chunk_overlap * 4,
            separators=["\n\n", "\n", ". ", "! ", "? ", ", ", " ", ""],
        )

    chunks = splitter.split_text(text)
    # Filter out near-empty chunks
    return [c.strip() for c in chunks if len(c.strip()) > 20]
