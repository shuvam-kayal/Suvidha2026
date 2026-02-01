"""
Billing Service - Bill Management & Payments
SUVIDHA 2026 - C-DAC Hackathon

Database-backed billing service with PostgreSQL persistence.
"""

import os
import time
import uuid
import secrets
from datetime import datetime
from typing import Optional
from decimal import Decimal
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Query, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession

from .models import (
    BillSummary, BillStatus, UtilityType,
    PaymentRequest, PaymentStatus, Receipt
)
from .db import (
    init_db, close_db, get_db, get_db_context,
    get_all_bills, get_bill_by_id, get_bill_payments,
    create_payment, Bill, Payment,
)


# =============================================================================
# CONFIGURATION
# =============================================================================

PORT = int(os.getenv("PORT", "3002"))


# =============================================================================
# LIFESPAN
# =============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    print(f"\n💳 Billing Service starting on port {PORT}")
    await init_db()
    yield
    await close_db()
    print("Billing Service stopped")


# =============================================================================
# APP SETUP
# =============================================================================

app = FastAPI(
    title="SUVIDHA Billing Service",
    description="Bill Management & Payments",
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
        "service": "billing-service",
        "database": db_status,
        "timestamp": datetime.utcnow().isoformat(),
    }


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def bill_to_summary(bill: Bill) -> dict:
    """Convert Bill model to summary dict."""
    return {
        "id": str(bill.id),
        "utilityType": bill.account.utility_type if bill.account else "UNKNOWN",
        "billNumber": bill.bill_number,
        "dueDate": bill.due_date.isoformat() if bill.due_date else None,
        "amountDue": float(bill.amount_due),
        "amountPaid": float(bill.amount_paid),
        "status": bill.status,
    }


def bill_to_detail(bill: Bill) -> dict:
    """Convert Bill model to detailed dict."""
    return {
        "id": str(bill.id),
        "accountId": str(bill.account_id),
        "utilityType": bill.account.utility_type if bill.account else "UNKNOWN",
        "billNumber": bill.bill_number,
        "billDate": bill.bill_date.isoformat() if bill.bill_date else None,
        "dueDate": bill.due_date.isoformat() if bill.due_date else None,
        "amountDue": float(bill.amount_due),
        "amountPaid": float(bill.amount_paid),
        "status": bill.status,
        "details": bill.bill_details or {},
        "payments": [
            {
                "id": str(p.id),
                "amount": float(p.amount),
                "paymentMethod": p.payment_method,
                "transactionId": p.transaction_id,
                "status": p.status,
                "timestamp": p.payment_timestamp.isoformat() if p.payment_timestamp else None,
            }
            for p in (bill.payments or [])
        ],
    }


# =============================================================================
# GET BILLS
# =============================================================================

@app.get("/bills")
async def get_bills(
    type: Optional[str] = Query(None, description="Filter by utility type"),
    status: Optional[str] = Query(None, description="Filter by status"),
):
    """Get list of bills."""
    async with get_db_context() as db:
        bills = await get_all_bills(db, utility_type=type, status=status)
        bill_summaries = [bill_to_summary(bill) for bill in bills]
    
    return {
        "success": True,
        "bills": bill_summaries,
        "total": len(bill_summaries),
    }


# =============================================================================
# GET BILL DETAILS
# =============================================================================

@app.get("/bills/{bill_id}")
async def get_bill_details(bill_id: str):
    """Get bill details by ID."""
    try:
        bill_uuid = uuid.UUID(bill_id)
    except ValueError:
        raise HTTPException(status_code=400, detail={"error": "Invalid bill ID format"})
    
    async with get_db_context() as db:
        bill = await get_bill_by_id(db, bill_uuid)
        
        if not bill:
            raise HTTPException(status_code=404, detail={"error": "Bill not found"})
        
        return {
            "success": True,
            "bill": bill_to_detail(bill),
        }


# =============================================================================
# PROCESS PAYMENT
# =============================================================================

@app.post("/payments")
async def process_payment(data: PaymentRequest):
    """Process a payment."""
    bill_id = data.billId
    amount = data.amount
    payment_method = data.paymentMethod
    
    # Validation
    if not bill_id or not amount or not payment_method:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Missing required fields",
                "required": ["billId", "amount", "paymentMethod"],
            }
        )
    
    try:
        bill_uuid = uuid.UUID(bill_id)
    except ValueError:
        raise HTTPException(status_code=400, detail={"error": "Invalid bill ID format"})
    
    if amount <= 0:
        raise HTTPException(status_code=400, detail={"error": "Invalid payment amount"})
    
    async with get_db_context() as db:
        bill = await get_bill_by_id(db, bill_uuid)
        
        if not bill:
            raise HTTPException(status_code=404, detail={"error": "Bill not found"})
        
        remaining = float(bill.amount_due) - float(bill.amount_paid)
        if amount > remaining:
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "Amount exceeds balance due",
                    "balanceDue": remaining,
                }
            )
        
        # Generate transaction ID
        transaction_id = f"TXN{hex(int(time.time()))[2:].upper()}{secrets.token_hex(2).upper()}"
        
        # Create payment (transactional)
        payment = await create_payment(
            db=db,
            bill=bill,
            amount=Decimal(str(amount)),
            payment_method=payment_method,
            transaction_id=transaction_id,
        )
        
        # Reload bill for updated values
        bill = await get_bill_by_id(db, bill_uuid)
        
        # Generate receipt
        receipt = {
            "receiptNumber": f"RCP-{transaction_id}",
            "transactionId": transaction_id,
            "billNumber": bill.bill_number,
            "utilityType": bill.account.utility_type if bill.account else None,
            "amountPaid": amount,
            "paymentMethod": payment_method,
            "paymentDate": payment.payment_timestamp.isoformat(),
            "remainingBalance": float(bill.amount_due) - float(bill.amount_paid),
            "status": "SUCCESS",
        }
        
        print(f"✅ Payment processed: {transaction_id} - ₹{amount}")
        
        return {
            "success": True,
            "payment": {
                "id": str(payment.id),
                "billId": bill_id,
                "amount": amount,
                "paymentMethod": payment_method,
                "transactionId": transaction_id,
                "status": "SUCCESS",
                "timestamp": payment.payment_timestamp.isoformat(),
            },
            "receipt": receipt,
            "message": "Payment processed successfully",
        }


# =============================================================================
# GET PAYMENT HISTORY
# =============================================================================

@app.get("/payments/history")
async def get_payment_history(billId: Optional[str] = Query(None)):
    """Get payment history."""
    async with get_db_context() as db:
        if billId:
            try:
                bill_uuid = uuid.UUID(billId)
                payments = await get_bill_payments(db, bill_uuid)
            except ValueError:
                payments = []
        else:
            # Get all payments (limited for performance)
            from sqlalchemy import select
            from .db import Payment
            result = await db.execute(
                select(Payment).order_by(Payment.payment_timestamp.desc()).limit(100)
            )
            payments = list(result.scalars().all())
        
        payment_list = [
            {
                "id": str(p.id),
                "billId": str(p.bill_id),
                "amount": float(p.amount),
                "paymentMethod": p.payment_method,
                "transactionId": p.transaction_id,
                "status": p.status,
                "timestamp": p.payment_timestamp.isoformat() if p.payment_timestamp else None,
            }
            for p in payments
        ]
        
        return {
            "success": True,
            "payments": payment_list,
            "total": len(payment_list),
        }


# =============================================================================
# GET PAYMENT RECEIPT
# =============================================================================

@app.get("/payments/{payment_id}/receipt")
async def get_payment_receipt(payment_id: str):
    """Get payment receipt."""
    try:
        payment_uuid = uuid.UUID(payment_id)
    except ValueError:
        raise HTTPException(status_code=400, detail={"error": "Invalid payment ID format"})
    
    async with get_db_context() as db:
        from sqlalchemy import select
        from sqlalchemy.orm import selectinload
        from .db import Payment
        
        result = await db.execute(
            select(Payment)
            .options(selectinload(Payment.bill).selectinload(Bill.account))
            .where(Payment.id == payment_uuid)
        )
        payment = result.scalar_one_or_none()
        
        if not payment:
            raise HTTPException(status_code=404, detail={"error": "Payment not found"})
        
        bill = payment.bill
        
        receipt = {
            "receiptNumber": f"RCP-{payment.transaction_id}",
            "transactionId": payment.transaction_id,
            "billNumber": bill.bill_number if bill else None,
            "utilityType": bill.account.utility_type if bill and bill.account else None,
            "amountPaid": float(payment.amount),
            "paymentMethod": payment.payment_method,
            "paymentDate": payment.payment_timestamp.isoformat() if payment.payment_timestamp else None,
            "status": payment.status,
        }
        
        return {
            "success": True,
            "receipt": receipt,
        }


# =============================================================================
# MAIN
# =============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=PORT)
