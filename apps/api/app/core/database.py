"""
NEXUS — Async Database Engine (SQLAlchemy + asyncpg)
"""
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings

# Global engine and session factory
_engine: AsyncEngine | None = None
_session_factory: async_sessionmaker[AsyncSession] | None = None


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models."""
    pass


async def create_db_pool() -> None:
    """Create the database connection pool at application startup."""
    global _engine, _session_factory
    _engine = create_async_engine(
        settings.DATABASE_URL,
        echo=settings.APP_ENV == "development",
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20,
    )
    _session_factory = async_sessionmaker(
        bind=_engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autoflush=False,
    )


async def close_db_pool() -> None:
    """Dispose of the connection pool at application shutdown."""
    global _engine
    if _engine:
        await _engine.dispose()
        _engine = None


def get_engine() -> AsyncEngine:
    if _engine is None:
        raise RuntimeError("Database pool not initialized. Call create_db_pool() first.")
    return _engine


async def get_db() -> AsyncSession:
    """FastAPI dependency that yields a database session."""
    if _session_factory is None:
        raise RuntimeError("Database pool not initialized.")
    async with _session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
