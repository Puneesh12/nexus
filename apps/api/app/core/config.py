"""
NEXUS — Application Configuration
All settings are loaded from environment variables.
"""
from functools import lru_cache
from typing import Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Application ─────────────────────────────────────────────
    APP_ENV: Literal["development", "staging", "production"] = "development"
    APP_SECRET_KEY: str = Field(..., min_length=32)
    APP_ALLOWED_ORIGINS: list[str] = ["http://localhost:3000"]

    # ── Database ────────────────────────────────────────────────
    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://nexus:nexus_dev_password@localhost:5432/nexus"
    )

    # ── OpenAI ──────────────────────────────────────────────────
    OPENAI_API_KEY: str = ""
    OPENAI_EMBEDDING_MODEL: str = "text-embedding-3-small"
    OPENAI_EMBEDDING_DIMENSIONS: int = 1536
    OPENAI_CHAT_MODEL: str = "gpt-4o-mini"
    OPENAI_MAX_TOKENS: int = 4096

    # ── Reranking ───────────────────────────────────────────────
    RERANKER_TYPE: Literal["cross_encoder", "cohere", "none"] = "none"
    COHERE_API_KEY: str = ""

    # ── Ingestion ───────────────────────────────────────────────
    MAX_UPLOAD_SIZE_MB: int = 50
    ALLOWED_MIME_TYPES: list[str] = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
        "text/markdown",
    ]
    CHUNK_SIZE: int = 512
    CHUNK_OVERLAP: int = 128

    # ── Retrieval ───────────────────────────────────────────────
    VECTOR_SEARCH_LIMIT: int = 20
    FULL_TEXT_SEARCH_LIMIT: int = 20
    RERANKER_TOP_K: int = 5

    # ── Auth ────────────────────────────────────────────────────
    JWT_SECRET_KEY: str = Field(default="change-me", min_length=8)
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # ── Observability ────────────────────────────────────────────
    LOG_LEVEL: str = "INFO"
    ENABLE_QUERY_TRACES: bool = True

    @field_validator("APP_ALLOWED_ORIGINS", "ALLOWED_MIME_TYPES", mode="before")
    @classmethod
    def parse_list(cls, v: str | list) -> list[str]:
        if isinstance(v, str):
            return [item.strip() for item in v.split(",")]
        return v

    @property
    def max_upload_size_bytes(self) -> int:
        return self.MAX_UPLOAD_SIZE_MB * 1024 * 1024


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
