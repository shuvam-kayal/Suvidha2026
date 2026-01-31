"""
Billing Service - Bill Management & Payments
SUVIDHA 2026 - C-DAC Hackathon
"""

from datetime import datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel


class UtilityType(str, Enum):
    ELECTRICITY = "ELECTRICITY"
    GAS = "GAS"
    WATER = "WATER"
    MUNICIPAL = "MUNICIPAL"


class BillStatus(str, Enum):
    PENDING = "PENDING"
    PAID = "PAID"
    OVERDUE = "OVERDUE"
    PARTIALLY_PAID = "PARTIALLY_PAID"


class PaymentStatus(str, Enum):
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    PENDING = "PENDING"


class BillDetails(BaseModel):
    unitsConsumed: Optional[float] = None
    ratePerUnit: Optional[float] = None
    fixedCharges: float
    taxes: float
    previousBalance: Optional[float] = None


class Bill(BaseModel):
    id: str
    accountId: str
    utilityType: UtilityType
    billNumber: str
    billDate: str
    dueDate: str
    amountDue: float
    amountPaid: float
    status: BillStatus
    details: BillDetails


class BillSummary(BaseModel):
    id: str
    utilityType: UtilityType
    billNumber: str
    dueDate: str
    amountDue: float
    status: BillStatus


class Payment(BaseModel):
    id: str
    billId: str
    amount: float
    paymentMethod: str
    transactionId: str
    status: PaymentStatus
    timestamp: str


class PaymentRequest(BaseModel):
    billId: str
    amount: float
    paymentMethod: str


class Receipt(BaseModel):
    receiptNumber: str
    transactionId: str
    billNumber: Optional[str]
    utilityType: Optional[UtilityType]
    amountPaid: float
    paymentMethod: str
    paymentDate: str
    remainingBalance: Optional[float] = None
    status: str
