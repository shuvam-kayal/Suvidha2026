"""
Database Configuration and Session Management
SUVIDHA 2026 - C-DAC Hackathon

Async SQLAlchemy setup for PostgreSQL connection.
"""

import os
from typing import AsyncGenerator
from contextlib import asynccontextmanager

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    AsyncEngine,
    create_async_engine,
    async_sessionmaker,
)
from sqlalchemy.pool import NullPool

# Global engine and session factory
_engine: AsyncEngine | None = None
_session_factory: async_sessionmaker[AsyncSession] | None = None


def get_database_url() -> str:
    """Get database URL from environment, converting to async format."""
    url = os.getenv(
        "DATABASE_URL",
        "postgresql://suvidha:suvidha_secure_2026@localhost:5432/suvidha_db"
    )
    # Convert postgresql:// to postgresql+asyncpg://
    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return url


def get_engine() -> AsyncEngine:
    """Get or create the database engine."""
    global _engine
    if _engine is None:
        _engine = create_async_engine(
            get_database_url(),
            echo=os.getenv("ENVIRONMENT", "development") == "development",
            poolclass=NullPool,  # Better for multi-process deployment
        )
    return _engine


def get_session_factory() -> async_sessionmaker[AsyncSession]:
    """Get or create the session factory."""
    global _session_factory
    if _session_factory is None:
        _session_factory = async_sessionmaker(
            bind=get_engine(),
            class_=AsyncSession,
            expire_on_commit=False,
            autoflush=False,
        )
    return _session_factory


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency for FastAPI to get database session.
    Usage: db: AsyncSession = Depends(get_session)
    """
    factory = get_session_factory()
    async with factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


# Alias for FastAPI dependency injection
get_db = get_session


@asynccontextmanager
async def get_db_context() -> AsyncGenerator[AsyncSession, None]:
    """
    Context manager for database session (for use outside FastAPI routes).
    Usage: async with get_db_context() as db:
    """
    factory = get_session_factory()
    async with factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def init_db() -> bool:
    """
    Initialize database connection and verify connectivity.
    Returns True if connection successful.
    """
    try:
        engine = get_engine()
        async with engine.begin() as conn:
            # Simple query to verify connection
            await conn.execute("SELECT 1")
        print("✅ Connected to PostgreSQL")
        return True
    except Exception as e:
        print(f"❌ Database connection error: {e}")
        return False


async def close_db() -> None:
    """Close database connection pool."""
    global _engine, _session_factory
    if _engine is not None:
        await _engine.dispose()
        _engine = None
        _session_factory = None
        print("Database connection closed")


async def test_connection() -> None:
    """Test database connection (for CLI use)."""
    success = await init_db()
    if success:
        print("Database connection test passed!")
    else:
        print("Database connection test failed!")
    await close_db()
