# Database Package
# Shared database models and utilities for SUVIDHA 2026 microservices

from .database import (
    get_engine,
    get_session,
    get_db,
    init_db,
    close_db,
)

from .models import (
    Base,
    # Auth Schema
    User,
    Session,
    # Billing Schema
    UtilityAccount,
    Bill,
    Payment,
    # Grievance Schema
    Complaint,
    ComplaintUpdate,
    ServiceRequest,
    # Public Schema
    AuditLog,
)

__all__ = [
    # Database utilities
    "get_engine",
    "get_session", 
    "get_db",
    "init_db",
    "close_db",
    # Models
    "Base",
    "User",
    "Session",
    "UtilityAccount",
    "Bill",
    "Payment",
    "Complaint",
    "ComplaintUpdate",
    "ServiceRequest",
    "AuditLog",
]
