"""
Database Configuration for Billing Service
SUVIDHA 2026 - C-DAC Hackathon

Async SQLAlchemy setup for PostgreSQL connection with billing schema models.
"""

import os
import uuid
from datetime import datetime, date
from typing import AsyncGenerator, Optional, List
from decimal import Decimal
from contextlib import asynccontextmanager

from sqlalchemy import (
    String, Text, Boolean, DateTime, Date, Numeric,
    ForeignKey, Index, CheckConstraint, select, update
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


class UtilityAccount(Base):
    """Utility Account model - billing.utility_accounts table."""
    __tablename__ = "utility_accounts"
    __table_args__ = {"schema": "billing"}

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    utility_type: Mapped[str] = mapped_column(String(20), nullable=False)
    account_number: Mapped[str] = mapped_column(String(50), nullable=False)
    connection_address: Mapped[str] = mapped_column(Text, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow
    )

    # Relationships
    bills: Mapped[List["Bill"]] = relationship(back_populates="account")


class Bill(Base):
    """Bill model - billing.bills table."""
    __tablename__ = "bills"
    __table_args__ = (
        Index("idx_bills_account_id", "account_id"),
        Index("idx_bills_status", "status"),
        {"schema": "billing"},
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    account_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("billing.utility_accounts.id"), nullable=False
    )
    bill_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    bill_date: Mapped[date] = mapped_column(Date, nullable=False)
    due_date: Mapped[date] = mapped_column(Date, nullable=False)
    amount_due: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    amount_paid: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0"))
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="PENDING")
    bill_details: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow
    )

    # Relationships
    account: Mapped["UtilityAccount"] = relationship(back_populates="bills")
    payments: Mapped[List["Payment"]] = relationship(back_populates="bill")


class Payment(Base):
    """Payment model - billing.payments table."""
    __tablename__ = "payments"
    __table_args__ = (
        Index("idx_payments_bill_id", "bill_id"),
        {"schema": "billing"},
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    bill_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("billing.bills.id"), nullable=False
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    payment_method: Mapped[str] = mapped_column(String(50), nullable=False)
    transaction_id: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="SUCCESS")
    payment_timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow
    )
    receipt_data: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)

    # Relationships
    bill: Mapped["Bill"] = relationship(back_populates="payments")


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
    """Context manager for database session (for use outside FastAPI routes)."""
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
# BILL OPERATIONS
# =============================================================================

async def get_all_bills(
    db: AsyncSession,
    utility_type: Optional[str] = None,
    status: Optional[str] = None,
) -> List[Bill]:
    """Get all bills with optional filtering."""
    query = select(Bill).options(selectinload(Bill.account))
    
    if utility_type:
        query = query.join(Bill.account).where(UtilityAccount.utility_type == utility_type.upper())
    
    if status:
        query = query.where(Bill.status == status.upper())
    
    result = await db.execute(query)
    return list(result.scalars().all())


async def get_bill_by_id(db: AsyncSession, bill_id: uuid.UUID) -> Optional[Bill]:
    """Get bill by ID with payments."""
    query = select(Bill).options(
        selectinload(Bill.account),
        selectinload(Bill.payments)
    ).where(Bill.id == bill_id)
    result = await db.execute(query)
    return result.scalar_one_or_none()


async def get_bill_payments(db: AsyncSession, bill_id: uuid.UUID) -> List[Payment]:
    """Get payments for a bill."""
    query = select(Payment).where(Payment.bill_id == bill_id).order_by(Payment.payment_timestamp.desc())
    result = await db.execute(query)
    return list(result.scalars().all())


async def create_payment(
    db: AsyncSession,
    bill: Bill,
    amount: Decimal,
    payment_method: str,
    transaction_id: str,
) -> Payment:
    """Create a payment and update bill status (transactional)."""
    # Create payment record
    payment = Payment(
        bill_id=bill.id,
        amount=amount,
        payment_method=payment_method,
        transaction_id=transaction_id,
        status="SUCCESS",
    )
    db.add(payment)
    
    # Update bill
    new_amount_paid = bill.amount_paid + amount
    if new_amount_paid >= bill.amount_due:
        new_status = "PAID"
    else:
        new_status = "PARTIALLY_PAID"
    
    await db.execute(
        update(Bill)
        .where(Bill.id == bill.id)
        .values(amount_paid=new_amount_paid, status=new_status)
    )
    
    # Reload bill to get updated values
    await db.flush()
    
    return payment
