"""
Billing Service - Bill Management & Payments
SUVIDHA 2026 - C-DAC Hackathon
"""

import os
import time
import secrets
from datetime import datetime
from typing import List, Optional

from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware

from .models import (
    Bill, BillSummary, BillDetails, BillStatus, UtilityType,
    Payment, PaymentRequest, PaymentStatus, Receipt
)


# =============================================================================
# CONFIGURATION
# =============================================================================

PORT = int(os.getenv("PORT", "3002"))


# =============================================================================
# MOCK DATA
# =============================================================================

mock_bills: List[Bill] = [
    Bill(
        id="bill_elec_001",
        accountId="acc_elec_001",
        utilityType=UtilityType.ELECTRICITY,
        billNumber="ELEC-2026-001234",
        billDate="2026-01-01",
        dueDate="2026-01-20",
        amountDue=2450.00,
        amountPaid=0,
        status=BillStatus.PENDING,
        details=BillDetails(
            unitsConsumed=245,
            ratePerUnit=8.50,
            fixedCharges=150,
            taxes=217.50,
        ),
    ),
    Bill(
        id="bill_gas_001",
        accountId="acc_gas_001",
        utilityType=UtilityType.GAS,
        billNumber="GAS-2026-005678",
        billDate="2026-01-05",
        dueDate="2026-01-25",
        amountDue=850.00,
        amountPaid=0,
        status=BillStatus.PENDING,
        details=BillDetails(
            unitsConsumed=42,
            ratePerUnit=18.00,
            fixedCharges=75,
            taxes=19.00,
        ),
    ),
    Bill(
        id="bill_water_001",
        accountId="acc_water_001",
        utilityType=UtilityType.WATER,
        billNumber="WTR-2026-009012",
        billDate="2026-01-03",
        dueDate="2026-01-23",
        amountDue=520.00,
        amountPaid=0,
        status=BillStatus.PENDING,
        details=BillDetails(
            unitsConsumed=12000,
            ratePerUnit=0.035,
            fixedCharges=50,
            taxes=50.00,
        ),
    ),
    Bill(
        id="bill_muni_001",
        accountId="acc_muni_001",
        utilityType=UtilityType.MUNICIPAL,
        billNumber="MUN-2026-012345",
        billDate="2025-12-15",
        dueDate="2026-01-15",
        amountDue=3200.00,
        amountPaid=0,
        status=BillStatus.OVERDUE,
        details=BillDetails(
            fixedCharges=2800,
            taxes=400,
            previousBalance=0,
        ),
    ),
]

payments: List[Payment] = []


# =============================================================================
# APP SETUP
# =============================================================================

app = FastAPI(
    title="SUVIDHA Billing Service",
    description="Bill Management & Payments",
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
    print(f"\n💳 Billing Service running on port {PORT}")
    print(f"📊 Mock bills loaded: {len(mock_bills)}")


# =============================================================================
# HEALTH CHECK
# =============================================================================

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "billing-service",
        "timestamp": datetime.utcnow().isoformat(),
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
    filtered_bills = list(mock_bills)
    
    if type:
        filtered_bills = [b for b in filtered_bills if b.utilityType.value == type.upper()]
    
    if status:
        filtered_bills = [b for b in filtered_bills if b.status.value == status.upper()]
    
    # Return summary view
    bill_summaries = [
        BillSummary(
            id=bill.id,
            utilityType=bill.utilityType,
            billNumber=bill.billNumber,
            dueDate=bill.dueDate,
            amountDue=bill.amountDue,
            status=bill.status,
        )
        for bill in filtered_bills
    ]
    
    return {
        "success": True,
        "bills": [b.model_dump() for b in bill_summaries],
        "total": len(bill_summaries),
    }


# =============================================================================
# GET BILL DETAILS
# =============================================================================

@app.get("/bills/{bill_id}")
async def get_bill_details(bill_id: str):
    """Get bill details by ID."""
    bill = next((b for b in mock_bills if b.id == bill_id), None)
    
    if not bill:
        raise HTTPException(status_code=404, detail={"error": "Bill not found"})
    
    # Get payment history for this bill
    bill_payments = [p for p in payments if p.billId == bill_id]
    
    return {
        "success": True,
        "bill": {
            **bill.model_dump(),
            "payments": [p.model_dump() for p in bill_payments],
        },
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
    
    bill = next((b for b in mock_bills if b.id == bill_id), None)
    if not bill:
        raise HTTPException(status_code=404, detail={"error": "Bill not found"})
    
    if amount <= 0:
        raise HTTPException(status_code=400, detail={"error": "Invalid payment amount"})
    
    remaining = bill.amountDue - bill.amountPaid
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
    
    # Create payment record
    payment = Payment(
        id=f"pay_{int(time.time())}",
        billId=bill_id,
        amount=amount,
        paymentMethod=payment_method,
        transactionId=transaction_id,
        status=PaymentStatus.SUCCESS,
        timestamp=datetime.utcnow().isoformat(),
    )
    
    payments.append(payment)
    
    # Update bill
    bill.amountPaid += amount
    if bill.amountPaid >= bill.amountDue:
        bill.status = BillStatus.PAID
    else:
        bill.status = BillStatus.PARTIALLY_PAID
    
    # Generate receipt
    receipt = Receipt(
        receiptNumber=f"RCP-{transaction_id}",
        transactionId=transaction_id,
        billNumber=bill.billNumber,
        utilityType=bill.utilityType,
        amountPaid=amount,
        paymentMethod=payment_method,
        paymentDate=payment.timestamp,
        remainingBalance=bill.amountDue - bill.amountPaid,
        status="SUCCESS",
    )
    
    print(f"✅ Payment processed: {transaction_id} - ₹{amount}")
    
    return {
        "success": True,
        "payment": payment.model_dump(),
        "receipt": receipt.model_dump(),
        "message": "Payment processed successfully",
    }


# =============================================================================
# GET PAYMENT HISTORY
# =============================================================================

@app.get("/payments/history")
async def get_payment_history(billId: Optional[str] = Query(None)):
    """Get payment history."""
    filtered_payments = list(payments)
    
    if billId:
        filtered_payments = [p for p in filtered_payments if p.billId == billId]
    
    # Sort by most recent first
    filtered_payments.sort(key=lambda p: p.timestamp, reverse=True)
    
    return {
        "success": True,
        "payments": [p.model_dump() for p in filtered_payments],
        "total": len(filtered_payments),
    }


# =============================================================================
# GET PAYMENT RECEIPT
# =============================================================================

@app.get("/payments/{payment_id}/receipt")
async def get_payment_receipt(payment_id: str):
    """Get payment receipt."""
    payment = next((p for p in payments if p.id == payment_id), None)
    
    if not payment:
        raise HTTPException(status_code=404, detail={"error": "Payment not found"})
    
    bill = next((b for b in mock_bills if b.id == payment.billId), None)
    
    receipt = Receipt(
        receiptNumber=f"RCP-{payment.transactionId}",
        transactionId=payment.transactionId,
        billNumber=bill.billNumber if bill else None,
        utilityType=bill.utilityType if bill else None,
        amountPaid=payment.amount,
        paymentMethod=payment.paymentMethod,
        paymentDate=payment.timestamp,
        status=payment.status.value,
    )
    
    return {
        "success": True,
        "receipt": receipt.model_dump(),
    }


# =============================================================================
# MAIN
# =============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=PORT)
