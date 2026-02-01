"""
Database Configuration for Auth Service
SUVIDHA 2026 - C-DAC Hackathon

Async SQLAlchemy setup for PostgreSQL connection.
"""

import os
import uuid
from datetime import datetime
from typing import AsyncGenerator, Optional
from contextlib import asynccontextmanager

from sqlalchemy import String, Boolean, DateTime, ForeignKey, Index, select
from sqlalchemy.dialects.postgresql import UUID, INET, JSONB
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    AsyncEngine,
    create_async_engine,
    async_sessionmaker,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy.pool import NullPool


# =============================================================================
# BASE AND MODELS
# =============================================================================

class Base(DeclarativeBase):
    """Base class for all models."""
    pass


class User(Base):
    """User model - auth.users table."""
    __tablename__ = "users"
    __table_args__ = {"schema": "auth"}

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    phone_number: Mapped[str] = mapped_column(String(15), unique=True, nullable=False)
    email: Mapped[Optional[str]] = mapped_column(String(255), unique=True, nullable=True)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    aadhaar_hash: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


class Session(Base):
    """Session model - auth.sessions table."""
    __tablename__ = "sessions"
    __table_args__ = (
        Index("idx_sessions_user_id", "user_id"),
        Index("idx_sessions_expires_at", "expires_at"),
        {"schema": "auth"},
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("auth.users.id", ondelete="CASCADE"), nullable=False
    )
    refresh_token_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    device_info: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    ip_address: Mapped[Optional[str]] = mapped_column(INET, nullable=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow
    )


# =============================================================================
# DATABASE ENGINE AND SESSION
# =============================================================================

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
            poolclass=NullPool,
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


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for FastAPI to get database session."""
    factory = get_session_factory()
    async with factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def init_db() -> bool:
    """Initialize database connection and verify connectivity."""
    try:
        engine = get_engine()
        async with engine.begin() as conn:
            from sqlalchemy import text
            await conn.execute(text("SELECT 1"))
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


# =============================================================================
# USER OPERATIONS
# =============================================================================

async def get_user_by_phone(db: AsyncSession, phone_number: str) -> Optional[User]:
    """Get user by phone number."""
    result = await db.execute(
        select(User).where(User.phone_number == phone_number)
    )
    return result.scalar_one_or_none()


async def create_user(db: AsyncSession, phone_number: str, full_name: str = "Citizen") -> User:
    """Create a new user."""
    user = User(
        phone_number=phone_number,
        full_name=full_name,
        is_active=True,
    )
    db.add(user)
    await db.flush()  # Get the ID without committing
    return user


async def get_or_create_user(db: AsyncSession, phone_number: str) -> tuple[User, bool]:
    """Get existing user or create new one. Returns (user, is_new)."""
    user = await get_user_by_phone(db, phone_number)
    if user:
        return user, False
    user = await create_user(db, phone_number)
    return user, True
