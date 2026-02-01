"""
Database Configuration for Grievance Service
SUVIDHA 2026 - C-DAC Hackathon

Async SQLAlchemy setup for PostgreSQL connection with grievance schema models.
"""

import os
import uuid
import random
from datetime import datetime
from typing import AsyncGenerator, Optional, List
from contextlib import asynccontextmanager

from sqlalchemy import (
    String, Text, DateTime,
    ForeignKey, Index, select, update
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    AsyncEngine,
    create_async_engine,
    async_sessionmaker,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship, selectinload
from sqlalchemy.pool import NullPool


# =============================================================================
# BASE AND MODELS
# =============================================================================

class Base(DeclarativeBase):
    """Base class for all models."""
    pass


class Complaint(Base):
    """Complaint model - grievance.complaints table."""
    __tablename__ = "complaints"
    __table_args__ = (
        Index("idx_complaints_user_id", "user_id"),
        Index("idx_complaints_status", "status"),
        Index("idx_complaints_ticket", "ticket_number"),
        {"schema": "grievance"},
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    ticket_number: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    utility_type: Mapped[str] = mapped_column(String(20), nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    subject: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="OPEN")
    priority: Mapped[str] = mapped_column(String(10), nullable=False, default="MEDIUM")
    assigned_to: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), nullable=True)
    resolution_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )
    resolved_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationships
    updates: Mapped[List["ComplaintUpdate"]] = relationship(
        back_populates="complaint", cascade="all, delete-orphan"
    )


class ComplaintUpdate(Base):
    """Complaint Update model - grievance.complaint_updates table."""
    __tablename__ = "complaint_updates"
    __table_args__ = (
        Index("idx_complaint_updates_complaint_id", "complaint_id"),
        {"schema": "grievance"},
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    complaint_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("grievance.complaints.id", ondelete="CASCADE"), nullable=False
    )
    update_type: Mapped[str] = mapped_column(String(50), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    created_by: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow
    )

    # Relationships
    complaint: Mapped["Complaint"] = relationship(back_populates="updates")


class ServiceRequest(Base):
    """Service Request model - for new connections, address changes, bulk waste pickup."""
    __tablename__ = "service_requests"
    __table_args__ = (
        Index("idx_service_requests_user_id", "user_id"),
        Index("idx_service_requests_status", "status"),
        {"schema": "grievance"},
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    request_number: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    request_type: Mapped[str] = mapped_column(String(20), nullable=False)
    utility_type: Mapped[str] = mapped_column(String(20), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="PENDING")
    form_data: Mapped[dict] = mapped_column(JSONB, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
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


@asynccontextmanager
async def get_db_context() -> AsyncGenerator[AsyncSession, None]:
    """Context manager for database session."""
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
# HELPER FUNCTIONS
# =============================================================================

def generate_ticket_number() -> str:
    """Generate a unique ticket number."""
    prefix = "GRV"
    date_part = datetime.utcnow().strftime("%y%m%d")
    random_part = random.randint(1000, 9999)
    return f"{prefix}-{date_part}-{random_part}"


def generate_request_number() -> str:
    """Generate a unique service request number."""
    prefix = "SRQ"
    date_part = datetime.utcnow().strftime("%y%m%d")
    random_part = random.randint(1000, 9999)
    return f"{prefix}-{date_part}-{random_part}"


# =============================================================================
# COMPLAINT OPERATIONS
# =============================================================================

async def get_all_complaints(
    db: AsyncSession,
    status: Optional[str] = None,
    utility: Optional[str] = None,
) -> List[Complaint]:
    """Get all complaints with optional filtering."""
    query = select(Complaint).options(selectinload(Complaint.updates))
    
    if status:
        query = query.where(Complaint.status == status.upper())
    
    if utility:
        query = query.where(Complaint.utility_type == utility.upper())
    
    query = query.order_by(Complaint.created_at.desc())
    
    result = await db.execute(query)
    return list(result.scalars().all())


async def get_complaint_by_id(db: AsyncSession, complaint_id: uuid.UUID) -> Optional[Complaint]:
    """Get complaint by ID with updates."""
    query = select(Complaint).options(
        selectinload(Complaint.updates)
    ).where(Complaint.id == complaint_id)
    result = await db.execute(query)
    return result.scalar_one_or_none()


async def get_complaint_by_ticket(db: AsyncSession, ticket_number: str) -> Optional[Complaint]:
    """Get complaint by ticket number."""
    query = select(Complaint).options(
        selectinload(Complaint.updates)
    ).where(Complaint.ticket_number == ticket_number.upper())
    result = await db.execute(query)
    return result.scalar_one_or_none()


async def create_complaint(
    db: AsyncSession,
    user_id: uuid.UUID,
    utility_type: str,
    category: str,
    subject: str,
    description: str,
) -> Complaint:
    """Create a new complaint."""
    ticket_number = generate_ticket_number()
    
    complaint = Complaint(
        ticket_number=ticket_number,
        user_id=user_id,
        utility_type=utility_type.upper(),
        category=category,
        subject=subject,
        description=description,
        status="OPEN",
        priority="MEDIUM",
    )
    db.add(complaint)
    await db.flush()
    
    # Add initial update
    initial_update = ComplaintUpdate(
        complaint_id=complaint.id,
        update_type="CREATED",
        message="Complaint registered successfully. Our team will review your complaint shortly.",
    )
    db.add(initial_update)
    await db.flush()
    
    return complaint


async def update_complaint_status(
    db: AsyncSession,
    complaint: Complaint,
    status: str,
    message: Optional[str] = None,
    resolved_by: Optional[str] = None,
) -> Complaint:
    """Update complaint status."""
    now = datetime.utcnow()
    
    update_values = {
        "status": status.upper(),
        "updated_at": now,
    }
    
    if status.upper() == "RESOLVED":
        update_values["resolved_at"] = now
    
    await db.execute(
        update(Complaint)
        .where(Complaint.id == complaint.id)
        .values(**update_values)
    )
    
    if message:
        update_record = ComplaintUpdate(
            complaint_id=complaint.id,
            update_type="STATUS_CHANGE",
            message=message,
        )
        db.add(update_record)
    
    await db.flush()
    return complaint


async def add_complaint_update(
    db: AsyncSession,
    complaint: Complaint,
    message: str,
    admin_id: Optional[str] = None,
) -> ComplaintUpdate:
    """Add update to complaint."""
    update_record = ComplaintUpdate(
        complaint_id=complaint.id,
        update_type="COMMENT",
        message=message,
    )
    db.add(update_record)
    
    await db.execute(
        update(Complaint)
        .where(Complaint.id == complaint.id)
        .values(updated_at=datetime.utcnow())
    )
    
    await db.flush()
    return update_record


# =============================================================================
# SERVICE REQUEST OPERATIONS
# =============================================================================

async def get_all_service_requests(
    db: AsyncSession,
    request_type: Optional[str] = None,
    status: Optional[str] = None,
) -> List[ServiceRequest]:
    """Get all service requests with optional filtering."""
    query = select(ServiceRequest)
    
    if request_type:
        query = query.where(ServiceRequest.request_type == request_type.upper())
    
    if status:
        query = query.where(ServiceRequest.status == status.upper())
    
    query = query.order_by(ServiceRequest.created_at.desc())
    
    result = await db.execute(query)
    return list(result.scalars().all())


async def get_service_request_by_id(db: AsyncSession, request_id: uuid.UUID) -> Optional[ServiceRequest]:
    """Get service request by ID."""
    query = select(ServiceRequest).where(ServiceRequest.id == request_id)
    result = await db.execute(query)
    return result.scalar_one_or_none()


async def create_service_request(
    db: AsyncSession,
    user_id: uuid.UUID,
    request_type: str,
    utility_type: str,
    form_data: dict,
) -> ServiceRequest:
    """Create a new service request."""
    request_number = generate_request_number()
    
    request = ServiceRequest(
        request_number=request_number,
        user_id=user_id,
        request_type=request_type.upper(),
        utility_type=utility_type.upper(),
        form_data=form_data,
        status="PENDING",
    )
    db.add(request)
    await db.flush()
    
    return request
