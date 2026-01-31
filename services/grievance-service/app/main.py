"""
Grievance Service - Complaint Management
SUVIDHA 2026 - C-DAC Hackathon
"""

import os
import time
import random
from datetime import datetime
from typing import List, Optional

from fastapi import FastAPI, HTTPException, Query, Header, Request
from fastapi.middleware.cors import CORSMiddleware

from .models import (
    Complaint, ComplaintSummary, ComplaintUpdate, ComplaintStatus, ComplaintPriority,
    UtilityType, CreateComplaint, UpdateStatus, AddUpdate, CATEGORIES
)


# =============================================================================
# CONFIGURATION
# =============================================================================

PORT = int(os.getenv("PORT", "3003"))


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def generate_ticket_number() -> str:
    """Generate a unique ticket number."""
    prefix = "GRV"
    date_part = datetime.utcnow().strftime("%y%m%d")
    random_part = random.randint(1000, 9999)
    return f"{prefix}-{date_part}-{random_part}"


# =============================================================================
# MOCK DATA
# =============================================================================

complaints: List[Complaint] = [
    Complaint(
        id="comp_001",
        ticketNumber="GRV-260112-1234",
        userId="user_1234",
        utilityType=UtilityType.ELECTRICITY,
        category="Power Outage",
        subject="Frequent power cuts in area",
        description="There have been frequent power cuts in our area for the past week. Power goes off 5-6 times daily for 30 minutes each.",
        status=ComplaintStatus.IN_PROGRESS,
        priority=ComplaintPriority.HIGH,
        createdAt="2026-01-12T08:30:00Z",
        updatedAt="2026-01-13T14:00:00Z",
        updates=[
            ComplaintUpdate(
                id="upd_001",
                message="Complaint received. Assigned to field team for investigation.",
                createdBy="System",
                createdAt="2026-01-12T09:00:00Z",
            ),
            ComplaintUpdate(
                id="upd_002",
                message="Field team identified faulty transformer. Repair work scheduled.",
                createdBy="Field Engineer",
                createdAt="2026-01-13T14:00:00Z",
            ),
        ],
    ),
]


# =============================================================================
# APP SETUP
# =============================================================================

app = FastAPI(
    title="SUVIDHA Grievance Service",
    description="Complaint Management System",
    version="1.0.0",
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


@app.on_event("startup")
async def startup():
    print(f"\n📋 Grievance Service running on port {PORT}")
    print(f"📊 Mock complaints loaded: {len(complaints)}")


# =============================================================================
# HEALTH CHECK
# =============================================================================

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "grievance-service",
        "timestamp": datetime.utcnow().isoformat(),
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
async def create_complaint(
    data: CreateComplaint,
    x_user_id: Optional[str] = Header(None, alias="x-user-id"),
):
    """File a new complaint."""
    user_id = x_user_id or "anonymous"
    
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
    
    ticket_number = generate_ticket_number()
    now = datetime.utcnow().isoformat() + "Z"
    
    new_complaint = Complaint(
        id=f"comp_{int(time.time())}",
        ticketNumber=ticket_number,
        userId=user_id,
        utilityType=UtilityType(data.utilityType.upper()),
        category=data.category,
        subject=data.subject,
        description=data.description,
        status=ComplaintStatus.OPEN,
        priority=ComplaintPriority.MEDIUM,
        createdAt=now,
        updatedAt=now,
        updates=[
            ComplaintUpdate(
                id=f"upd_{int(time.time())}",
                message="Complaint registered successfully. Our team will review your complaint shortly.",
                createdBy="System",
                createdAt=now,
            )
        ],
    )
    
    complaints.append(new_complaint)
    
    print(f"📋 New complaint registered: {ticket_number}")
    
    return {
        "success": True,
        "ticketNumber": ticket_number,
        "message": "Complaint registered successfully",
        "complaint": {
            "id": new_complaint.id,
            "ticketNumber": new_complaint.ticketNumber,
            "status": new_complaint.status.value,
            "createdAt": new_complaint.createdAt,
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
    filtered = list(complaints)
    
    if status:
        filtered = [c for c in filtered if c.status.value == status.upper()]
    
    if utility:
        filtered = [c for c in filtered if c.utilityType.value == utility.upper()]
    
    # Sort by most recent
    filtered.sort(key=lambda c: c.createdAt, reverse=True)
    
    summaries = [
        ComplaintSummary(
            id=c.id,
            ticketNumber=c.ticketNumber,
            utilityType=c.utilityType,
            category=c.category,
            subject=c.subject,
            status=c.status,
            priority=c.priority,
            createdAt=c.createdAt,
            updatedAt=c.updatedAt,
        )
        for c in filtered
    ]
    
    return {
        "success": True,
        "complaints": [s.model_dump() for s in summaries],
        "total": len(summaries),
    }


# =============================================================================
# TRACK COMPLAINT BY TICKET NUMBER
# =============================================================================

@app.get("/complaints/track/{ticket_number}")
async def track_complaint(ticket_number: str):
    """Track complaint by ticket number."""
    complaint = next(
        (c for c in complaints if c.ticketNumber.upper() == ticket_number.upper()),
        None
    )
    
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
        "complaint": complaint.model_dump(),
    }


# =============================================================================
# GET COMPLAINT DETAILS
# =============================================================================

@app.get("/complaints/{complaint_id}")
async def get_complaint(complaint_id: str):
    """Get complaint details by ID."""
    complaint = next((c for c in complaints if c.id == complaint_id), None)
    
    if not complaint:
        raise HTTPException(status_code=404, detail={"error": "Complaint not found"})
    
    return {
        "success": True,
        "complaint": complaint.model_dump(),
    }


# =============================================================================
# ADMIN: UPDATE COMPLAINT STATUS
# =============================================================================

@app.patch("/complaints/{complaint_id}/status")
async def update_complaint_status(
    complaint_id: str,
    data: UpdateStatus,
    x_admin_id: Optional[str] = Header(None, alias="x-admin-id"),
):
    """Update complaint status (admin only)."""
    admin_id = x_admin_id or "admin"
    
    complaint = next((c for c in complaints if c.id == complaint_id), None)
    
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
    
    now = datetime.utcnow().isoformat() + "Z"
    
    if data.status:
        complaint.status = ComplaintStatus(data.status.upper())
        complaint.updatedAt = now
        
        if complaint.status == ComplaintStatus.RESOLVED:
            complaint.resolvedAt = now
    
    # Add update to history
    if data.message:
        complaint.updates.append(
            ComplaintUpdate(
                id=f"upd_{int(time.time())}",
                message=data.message,
                createdBy=data.resolvedBy or admin_id,
                createdAt=now,
            )
        )
    
    print(f"✅ Complaint {complaint.ticketNumber} updated to {complaint.status.value} by {admin_id}")
    
    return {
        "success": True,
        "message": "Complaint updated successfully",
        "complaint": {
            "id": complaint.id,
            "ticketNumber": complaint.ticketNumber,
            "status": complaint.status.value,
            "updatedAt": complaint.updatedAt,
            "resolvedAt": complaint.resolvedAt,
        },
    }


# =============================================================================
# ADMIN: ADD UPDATE/COMMENT TO COMPLAINT
# =============================================================================

@app.post("/complaints/{complaint_id}/updates")
async def add_complaint_update(
    complaint_id: str,
    data: AddUpdate,
    x_admin_id: Optional[str] = Header(None, alias="x-admin-id"),
):
    """Add update to complaint (admin only)."""
    admin_id = x_admin_id or "admin"
    
    complaint = next((c for c in complaints if c.id == complaint_id), None)
    
    if not complaint:
        raise HTTPException(status_code=404, detail={"error": "Complaint not found"})
    
    if not data.message or len(data.message.strip()) < 5:
        raise HTTPException(
            status_code=400,
            detail={"error": "Message must be at least 5 characters"}
        )
    
    now = datetime.utcnow().isoformat() + "Z"
    
    update = ComplaintUpdate(
        id=f"upd_{int(time.time())}",
        message=data.message.strip(),
        createdBy=admin_id,
        createdAt=now,
    )
    
    complaint.updates.append(update)
    complaint.updatedAt = now
    
    print(f"💬 Update added to {complaint.ticketNumber} by {admin_id}")
    
    return {
        "success": True,
        "update": update.model_dump(),
    }


# =============================================================================
# MAIN
# =============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=PORT)
