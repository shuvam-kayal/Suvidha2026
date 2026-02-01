"""
Grievance Service - Complaint & Service Request Management
SUVIDHA 2026 - C-DAC Hackathon

Database-backed grievance service with PostgreSQL persistence.
"""

import os
import uuid
from datetime import datetime
from typing import Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Query, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .models import (
    ComplaintStatus, ComplaintPriority,
    UtilityType, CreateComplaint, UpdateStatus, AddUpdate, CATEGORIES
)
from .db import (
    init_db, close_db, get_db_context,
    get_all_complaints, get_complaint_by_id, get_complaint_by_ticket,
    create_complaint, update_complaint_status, add_complaint_update,
    get_all_service_requests, get_service_request_by_id, create_service_request,
    Complaint, ComplaintUpdate, ServiceRequest,
)


# =============================================================================
# CONFIGURATION
# =============================================================================

PORT = int(os.getenv("PORT", "3003"))


# =============================================================================
# REQUEST MODELS
# =============================================================================

class CreateServiceRequest(BaseModel):
    requestType: str  # NEW_CONNECTION, ADDRESS_CHANGE, BULK_WASTE
    utilityType: str
    formData: dict


# =============================================================================
# LIFESPAN
# =============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    print(f"\n📋 Grievance Service starting on port {PORT}")
    await init_db()
    yield
    await close_db()
    print("Grievance Service stopped")


# =============================================================================
# APP SETUP
# =============================================================================

app = FastAPI(
    title="SUVIDHA Grievance Service",
    description="Complaint & Service Request Management System",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    print(f"[{datetime.utcnow().isoformat()}] {request.method} {request.url.path}")
    response = await call_next(request)
    return response


# =============================================================================
# HEALTH CHECK
# =============================================================================

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    db_status = "disconnected"
    try:
        from .db import get_engine
        from sqlalchemy import text
        engine = get_engine()
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception:
        db_status = "error"
    
    return {
        "status": "healthy" if db_status == "connected" else "degraded",
        "service": "grievance-service",
        "database": db_status,
        "timestamp": datetime.utcnow().isoformat(),
    }


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def complaint_to_summary(c: Complaint) -> dict:
    """Convert Complaint model to summary dict."""
    return {
        "id": str(c.id),
        "ticketNumber": c.ticket_number,
        "utilityType": c.utility_type,
        "category": c.category,
        "subject": c.subject,
        "status": c.status,
        "priority": c.priority,
        "createdAt": c.created_at.isoformat() if c.created_at else None,
        "updatedAt": c.updated_at.isoformat() if c.updated_at else None,
    }


def complaint_to_detail(c: Complaint) -> dict:
    """Convert Complaint model to detailed dict."""
    return {
        "id": str(c.id),
        "ticketNumber": c.ticket_number,
        "userId": str(c.user_id),
        "utilityType": c.utility_type,
        "category": c.category,
        "subject": c.subject,
        "description": c.description,
        "status": c.status,
        "priority": c.priority,
        "assignedTo": str(c.assigned_to) if c.assigned_to else None,
        "resolutionNotes": c.resolution_notes,
        "createdAt": c.created_at.isoformat() if c.created_at else None,
        "updatedAt": c.updated_at.isoformat() if c.updated_at else None,
        "resolvedAt": c.resolved_at.isoformat() if c.resolved_at else None,
        "updates": [
            {
                "id": str(u.id),
                "message": u.message,
                "createdBy": str(u.created_by) if u.created_by else "System",
                "createdAt": u.created_at.isoformat() if u.created_at else None,
            }
            for u in (c.updates or [])
        ],
    }


def service_request_to_dict(sr: ServiceRequest) -> dict:
    """Convert ServiceRequest model to dict."""
    return {
        "id": str(sr.id),
        "requestNumber": sr.request_number,
        "userId": str(sr.user_id),
        "requestType": sr.request_type,
        "utilityType": sr.utility_type,
        "status": sr.status,
        "formData": sr.form_data,
        "createdAt": sr.created_at.isoformat() if sr.created_at else None,
        "updatedAt": sr.updated_at.isoformat() if sr.updated_at else None,
    }


# =============================================================================
# GET CATEGORIES
# =============================================================================

@app.get("/categories")
async def get_categories(utility: Optional[str] = Query(None)):
    """Get complaint categories."""
    if utility:
        try:
            utility_type = UtilityType(utility.upper())
            return {
                "success": True,
                "categories": CATEGORIES.get(utility_type, []),
            }
        except ValueError:
            pass
    
    # Return all categories
    return {
        "success": True,
        "categories": {k.value: v for k, v in CATEGORIES.items()},
    }


# =============================================================================
# FILE NEW COMPLAINT
# =============================================================================

@app.post("/complaints", status_code=201)
async def create_complaint_endpoint(
    data: CreateComplaint,
    x_user_id: Optional[str] = Header(None, alias="x-user-id"),
):
    """File a new complaint."""
    # Validation
    if not data.utilityType or not data.category or not data.subject or not data.description:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Missing required fields",
                "required": ["utilityType", "category", "subject", "description"],
            }
        )
    
    if len(data.description) < 20:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Description too short",
                "message": "Please provide at least 20 characters describing your issue",
            }
        )
    
    # Parse user ID
    try:
        user_id = uuid.UUID(x_user_id) if x_user_id else uuid.uuid4()
    except ValueError:
        user_id = uuid.uuid4()
    
    async with get_db_context() as db:
        complaint = await create_complaint(
            db=db,
            user_id=user_id,
            utility_type=data.utilityType,
            category=data.category,
            subject=data.subject,
            description=data.description,
        )
        
        print(f"📋 New complaint registered: {complaint.ticket_number}")
        
        return {
            "success": True,
            "ticketNumber": complaint.ticket_number,
            "message": "Complaint registered successfully",
            "complaint": {
                "id": str(complaint.id),
                "ticketNumber": complaint.ticket_number,
                "status": complaint.status,
                "createdAt": complaint.created_at.isoformat() if complaint.created_at else None,
            },
        }


# =============================================================================
# GET USER'S COMPLAINTS
# =============================================================================

@app.get("/complaints")
async def get_complaints(
    status: Optional[str] = Query(None),
    utility: Optional[str] = Query(None),
    x_user_id: Optional[str] = Header(None, alias="x-user-id"),
):
    """Get list of complaints."""
    async with get_db_context() as db:
        complaints = await get_all_complaints(db, status=status, utility=utility)
        summaries = [complaint_to_summary(c) for c in complaints]
    
    return {
        "success": True,
        "complaints": summaries,
        "total": len(summaries),
    }


# =============================================================================
# TRACK COMPLAINT BY TICKET NUMBER
# =============================================================================

@app.get("/complaints/track/{ticket_number}")
async def track_complaint(ticket_number: str):
    """Track complaint by ticket number."""
    async with get_db_context() as db:
        complaint = await get_complaint_by_ticket(db, ticket_number)
        
        if not complaint:
            raise HTTPException(
                status_code=404,
                detail={
                    "error": "Complaint not found",
                    "message": "No complaint found with this ticket number",
                }
            )
        
        return {
            "success": True,
            "complaint": complaint_to_detail(complaint),
        }


# =============================================================================
# GET COMPLAINT DETAILS
# =============================================================================

@app.get("/complaints/{complaint_id}")
async def get_complaint(complaint_id: str):
    """Get complaint details by ID."""
    try:
        complaint_uuid = uuid.UUID(complaint_id)
    except ValueError:
        raise HTTPException(status_code=400, detail={"error": "Invalid complaint ID format"})
    
    async with get_db_context() as db:
        complaint = await get_complaint_by_id(db, complaint_uuid)
        
        if not complaint:
            raise HTTPException(status_code=404, detail={"error": "Complaint not found"})
        
        return {
            "success": True,
            "complaint": complaint_to_detail(complaint),
        }


# =============================================================================
# ADMIN: UPDATE COMPLAINT STATUS
# =============================================================================

@app.patch("/complaints/{complaint_id}/status")
async def update_complaint_status_endpoint(
    complaint_id: str,
    data: UpdateStatus,
    x_admin_id: Optional[str] = Header(None, alias="x-admin-id"),
):
    """Update complaint status (admin only)."""
    admin_id = x_admin_id or "admin"
    
    try:
        complaint_uuid = uuid.UUID(complaint_id)
    except ValueError:
        raise HTTPException(status_code=400, detail={"error": "Invalid complaint ID format"})
    
    async with get_db_context() as db:
        complaint = await get_complaint_by_id(db, complaint_uuid)
        
        if not complaint:
            raise HTTPException(status_code=404, detail={"error": "Complaint not found"})
        
        valid_statuses = [s.value for s in ComplaintStatus]
        if data.status and data.status.upper() not in valid_statuses:
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "Invalid status",
                    "validStatuses": valid_statuses,
                }
            )
        
        if data.status:
            await update_complaint_status(
                db=db,
                complaint=complaint,
                status=data.status,
                message=data.message,
                resolved_by=data.resolvedBy,
            )
        
        # Reload complaint
        complaint = await get_complaint_by_id(db, complaint_uuid)
        
        print(f"✅ Complaint {complaint.ticket_number} updated to {complaint.status} by {admin_id}")
        
        return {
            "success": True,
            "message": "Complaint updated successfully",
            "complaint": {
                "id": str(complaint.id),
                "ticketNumber": complaint.ticket_number,
                "status": complaint.status,
                "updatedAt": complaint.updated_at.isoformat() if complaint.updated_at else None,
                "resolvedAt": complaint.resolved_at.isoformat() if complaint.resolved_at else None,
            },
        }


# =============================================================================
# ADMIN: ADD UPDATE/COMMENT TO COMPLAINT
# =============================================================================

@app.post("/complaints/{complaint_id}/updates")
async def add_complaint_update_endpoint(
    complaint_id: str,
    data: AddUpdate,
    x_admin_id: Optional[str] = Header(None, alias="x-admin-id"),
):
    """Add update to complaint (admin only)."""
    admin_id = x_admin_id or "admin"
    
    try:
        complaint_uuid = uuid.UUID(complaint_id)
    except ValueError:
        raise HTTPException(status_code=400, detail={"error": "Invalid complaint ID format"})
    
    async with get_db_context() as db:
        complaint = await get_complaint_by_id(db, complaint_uuid)
        
        if not complaint:
            raise HTTPException(status_code=404, detail={"error": "Complaint not found"})
        
        if not data.message or len(data.message.strip()) < 5:
            raise HTTPException(
                status_code=400,
                detail={"error": "Message must be at least 5 characters"}
            )
        
        update_record = await add_complaint_update(
            db=db,
            complaint=complaint,
            message=data.message.strip(),
            admin_id=admin_id,
        )
        
        print(f"💬 Update added to {complaint.ticket_number} by {admin_id}")
        
        return {
            "success": True,
            "update": {
                "id": str(update_record.id),
                "message": update_record.message,
                "createdBy": admin_id,
                "createdAt": update_record.created_at.isoformat() if update_record.created_at else None,
            },
        }


# =============================================================================
# SERVICE REQUESTS - NEW CONNECTION, ADDRESS CHANGE, BULK WASTE
# =============================================================================

@app.post("/service-requests", status_code=201)
async def create_service_request_endpoint(
    data: CreateServiceRequest,
    x_user_id: Optional[str] = Header(None, alias="x-user-id"),
):
    """Create a new service request (new connection, address change, bulk waste)."""
    valid_types = ["NEW_CONNECTION", "ADDRESS_CHANGE", "BULK_WASTE"]
    if data.requestType.upper() not in valid_types:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Invalid request type",
                "validTypes": valid_types,
            }
        )
    
    # Parse user ID
    try:
        user_id = uuid.UUID(x_user_id) if x_user_id else uuid.uuid4()
    except ValueError:
        user_id = uuid.uuid4()
    
    async with get_db_context() as db:
        request = await create_service_request(
            db=db,
            user_id=user_id,
            request_type=data.requestType,
            utility_type=data.utilityType,
            form_data=data.formData,
        )
        
        print(f"📝 New service request: {request.request_number} ({request.request_type})")
        
        return {
            "success": True,
            "requestNumber": request.request_number,
            "message": f"Service request submitted successfully",
            "request": service_request_to_dict(request),
        }


@app.get("/service-requests")
async def get_service_requests(
    type: Optional[str] = Query(None, description="Filter by request type"),
    status: Optional[str] = Query(None, description="Filter by status"),
    x_user_id: Optional[str] = Header(None, alias="x-user-id"),
):
    """Get list of service requests."""
    async with get_db_context() as db:
        requests = await get_all_service_requests(db, request_type=type, status=status)
        request_list = [service_request_to_dict(r) for r in requests]
    
    return {
        "success": True,
        "requests": request_list,
        "total": len(request_list),
    }


@app.get("/service-requests/{request_id}")
async def get_service_request(request_id: str):
    """Get service request details by ID."""
    try:
        request_uuid = uuid.UUID(request_id)
    except ValueError:
        raise HTTPException(status_code=400, detail={"error": "Invalid request ID format"})
    
    async with get_db_context() as db:
        request = await get_service_request_by_id(db, request_uuid)
        
        if not request:
            raise HTTPException(status_code=404, detail={"error": "Service request not found"})
        
        return {
            "success": True,
            "request": service_request_to_dict(request),
        }


# =============================================================================
# MAIN
# =============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=PORT)
