"""
SQLAlchemy ORM Models
SUVIDHA 2026 - C-DAC Hackathon

Models matching the PostgreSQL schema defined in init-db.sql.
Each model uses the appropriate schema (auth, billing, grievance, public).
"""

import uuid
from datetime import datetime
from typing import Optional, List
from decimal import Decimal

from sqlalchemy import (
    String, Text, Boolean, DateTime, Date, Numeric,
    ForeignKey, Index, CheckConstraint, JSON,
)
from sqlalchemy.dialects.postgresql import UUID, INET, JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    """Base class for all models."""
    pass


# =============================================================================
# AUTH SCHEMA
# =============================================================================

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

    # Relationships
    sessions: Mapped[List["Session"]] = relationship(back_populates="user", cascade="all, delete-orphan")


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

    # Relationships
    user: Mapped["User"] = relationship(back_populates="sessions")


# =============================================================================
# BILLING SCHEMA
# =============================================================================

class UtilityAccount(Base):
    """Utility Account model - billing.utility_accounts table."""
    __tablename__ = "utility_accounts"
    __table_args__ = (
        CheckConstraint(
            "utility_type IN ('ELECTRICITY', 'GAS', 'WATER')",
            name="utility_accounts_utility_type_check"
        ),
        {"schema": "billing"},
    )

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
        CheckConstraint(
            "status IN ('PENDING', 'PAID', 'OVERDUE', 'PARTIALLY_PAID')",
            name="bills_status_check"
        ),
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
    bill_date: Mapped[datetime] = mapped_column(Date, nullable=False)
    due_date: Mapped[datetime] = mapped_column(Date, nullable=False)
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
        CheckConstraint(
            "status IN ('SUCCESS', 'FAILED', 'PENDING', 'REFUNDED')",
            name="payments_status_check"
        ),
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
# GRIEVANCE SCHEMA
# =============================================================================

class Complaint(Base):
    """Complaint model - grievance.complaints table."""
    __tablename__ = "complaints"
    __table_args__ = (
        CheckConstraint(
            "utility_type IN ('ELECTRICITY', 'GAS', 'WATER', 'MUNICIPAL')",
            name="complaints_utility_type_check"
        ),
        CheckConstraint(
            "status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'ESCALATED')",
            name="complaints_status_check"
        ),
        CheckConstraint(
            "priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')",
            name="complaints_priority_check"
        ),
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
        CheckConstraint(
            "request_type IN ('NEW_CONNECTION', 'ADDRESS_CHANGE', 'BULK_WASTE')",
            name="service_requests_type_check"
        ),
        CheckConstraint(
            "utility_type IN ('ELECTRICITY', 'GAS', 'WATER', 'MUNICIPAL')",
            name="service_requests_utility_check"
        ),
        CheckConstraint(
            "status IN ('PENDING', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED')",
            name="service_requests_status_check"
        ),
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
# PUBLIC SCHEMA
# =============================================================================

class AuditLog(Base):
    """Audit Log model - public.audit_log table."""
    __tablename__ = "audit_log"
    __table_args__ = (
        Index("idx_audit_log_event_type", "event_type"),
        Index("idx_audit_log_user_id", "user_id"),
        Index("idx_audit_log_created_at", "created_at"),
        {"schema": "public"},
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    event_type: Mapped[str] = mapped_column(String(50), nullable=False)
    entity_type: Mapped[str] = mapped_column(String(50), nullable=False)
    entity_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), nullable=True)
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), nullable=True)
    ip_address: Mapped[Optional[str]] = mapped_column(INET, nullable=True)
    user_agent: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    event_data: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow
    )
