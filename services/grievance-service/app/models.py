"""
Grievance Service - Complaint Types & Models
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


class ComplaintStatus(str, Enum):
    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"
    ESCALATED = "ESCALATED"


class ComplaintPriority(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    URGENT = "URGENT"


class ComplaintUpdate(BaseModel):
    id: str
    message: str
    createdBy: str
    createdAt: str


class Complaint(BaseModel):
    id: str
    ticketNumber: str
    userId: str
    utilityType: UtilityType
    category: str
    subject: str
    description: str
    status: ComplaintStatus
    priority: ComplaintPriority
    createdAt: str
    updatedAt: str
    resolvedAt: Optional[str] = None
    updates: List[ComplaintUpdate] = []


class ComplaintSummary(BaseModel):
    id: str
    ticketNumber: str
    utilityType: UtilityType
    category: str
    subject: str
    status: ComplaintStatus
    priority: ComplaintPriority
    createdAt: str
    updatedAt: str


class CreateComplaint(BaseModel):
    utilityType: str
    category: str
    subject: str
    description: str


class UpdateStatus(BaseModel):
    status: Optional[str] = None
    message: Optional[str] = None
    resolvedBy: Optional[str] = None


class AddUpdate(BaseModel):
    message: str


# Categories by utility type
CATEGORIES = {
    UtilityType.ELECTRICITY: [
        "Power Outage", "Meter Issue", "Billing Dispute", 
        "New Connection", "Voltage Fluctuation"
    ],
    UtilityType.GAS: [
        "Gas Leak", "Low Pressure", "Meter Issue", 
        "Billing Dispute", "New Connection"
    ],
    UtilityType.WATER: [
        "No Water Supply", "Low Pressure", "Water Quality", 
        "Leakage", "Billing Dispute"
    ],
    UtilityType.MUNICIPAL: [
        "Street Light", "Road Damage", "Garbage Collection", 
        "Drainage Issue", "Property Tax"
    ],
}
