"""
Database Seed Script
SUVIDHA 2026 - C-DAC Hackathon

Populates the database with development test data matching the previous mock data.
Run with: python -m packages.database.seed
"""

import asyncio
import uuid
from datetime import datetime, timedelta
from decimal import Decimal

from .database import get_db_context, init_db, close_db
from .models import (
    User, UtilityAccount, Bill, Payment,
    Complaint, ComplaintUpdate, ServiceRequest
)


async def seed_users():
    """Seed test users."""
    users = [
        User(
            id=uuid.UUID("11111111-1111-1111-1111-111111111111"),
            phone_number="9876543210",
            email="demo@suvidha.gov.in",
            full_name="Demo User",
            is_active=True,
        ),
        User(
            id=uuid.UUID("22222222-2222-2222-2222-222222222222"),
            phone_number="9123456789",
            email="test@suvidha.gov.in",
            full_name="Test Citizen",
            is_active=True,
        ),
    ]
    
    async with get_db_context() as db:
        for user in users:
            existing = await db.get(User, user.id)
            if not existing:
                db.add(user)
        await db.commit()
    
    print(f"✅ Seeded {len(users)} users")
    return users


async def seed_utility_accounts(user_id: uuid.UUID):
    """Seed utility accounts for a user."""
    accounts = [
        UtilityAccount(
            id=uuid.UUID("aaaa1111-1111-1111-1111-111111111111"),
            user_id=user_id,
            utility_type="ELECTRICITY",
            account_number="ELEC-001234",
            connection_address="123, Sector 15, Chandigarh - 160015",
        ),
        UtilityAccount(
            id=uuid.UUID("aaaa2222-2222-2222-2222-222222222222"),
            user_id=user_id,
            utility_type="GAS",
            account_number="GAS-005678",
            connection_address="123, Sector 15, Chandigarh - 160015",
        ),
        UtilityAccount(
            id=uuid.UUID("aaaa3333-3333-3333-3333-333333333333"),
            user_id=user_id,
            utility_type="WATER",
            account_number="WTR-009012",
            connection_address="123, Sector 15, Chandigarh - 160015",
        ),
    ]
    
    async with get_db_context() as db:
        for account in accounts:
            existing = await db.get(UtilityAccount, account.id)
            if not existing:
                db.add(account)
        await db.commit()
    
    print(f"✅ Seeded {len(accounts)} utility accounts")
    return accounts


async def seed_bills(accounts: list[UtilityAccount]):
    """Seed bills for utility accounts."""
    now = datetime.utcnow()
    
    bills = [
        # Electricity bill - pending
        Bill(
            id=uuid.UUID("bbbb1111-1111-1111-1111-111111111111"),
            account_id=accounts[0].id,
            bill_number="ELEC-2026-001234",
            bill_date=now - timedelta(days=30),
            due_date=now + timedelta(days=10),
            amount_due=Decimal("2450.00"),
            amount_paid=Decimal("0"),
            status="PENDING",
            bill_details={
                "unitsConsumed": 245,
                "ratePerUnit": 8.50,
                "fixedCharges": 150,
                "taxes": 217.50,
            },
        ),
        # Gas bill - pending
        Bill(
            id=uuid.UUID("bbbb2222-2222-2222-2222-222222222222"),
            account_id=accounts[1].id,
            bill_number="GAS-2026-005678",
            bill_date=now - timedelta(days=25),
            due_date=now + timedelta(days=15),
            amount_due=Decimal("850.00"),
            amount_paid=Decimal("0"),
            status="PENDING",
            bill_details={
                "unitsConsumed": 42,
                "ratePerUnit": 18.00,
                "fixedCharges": 75,
                "taxes": 19.00,
            },
        ),
        # Water bill - pending
        Bill(
            id=uuid.UUID("bbbb3333-3333-3333-3333-333333333333"),
            account_id=accounts[2].id,
            bill_number="WTR-2026-009012",
            bill_date=now - timedelta(days=27),
            due_date=now + timedelta(days=13),
            amount_due=Decimal("520.00"),
            amount_paid=Decimal("0"),
            status="PENDING",
            bill_details={
                "unitsConsumed": 12000,
                "ratePerUnit": 0.035,
                "fixedCharges": 50,
                "taxes": 50.00,
            },
        ),
        # Overdue bill
        Bill(
            id=uuid.UUID("bbbb4444-4444-4444-4444-444444444444"),
            account_id=accounts[0].id,
            bill_number="ELEC-2025-012345",
            bill_date=now - timedelta(days=60),
            due_date=now - timedelta(days=15),
            amount_due=Decimal("3200.00"),
            amount_paid=Decimal("0"),
            status="OVERDUE",
            bill_details={
                "unitsConsumed": 320,
                "ratePerUnit": 8.50,
                "fixedCharges": 150,
                "taxes": 330.00,
            },
        ),
    ]
    
    async with get_db_context() as db:
        for bill in bills:
            existing = await db.get(Bill, bill.id)
            if not existing:
                db.add(bill)
        await db.commit()
    
    print(f"✅ Seeded {len(bills)} bills")
    return bills


async def seed_complaints(user_id: uuid.UUID):
    """Seed sample complaints."""
    now = datetime.utcnow()
    
    complaint = Complaint(
        id=uuid.UUID("cccc1111-1111-1111-1111-111111111111"),
        ticket_number="GRV-260112-1234",
        user_id=user_id,
        utility_type="ELECTRICITY",
        category="Power Outage",
        subject="Frequent power cuts in area",
        description="There have been frequent power cuts in our area for the past week. Power goes off 5-6 times daily for 30 minutes each.",
        status="IN_PROGRESS",
        priority="HIGH",
        created_at=now - timedelta(days=10),
        updated_at=now - timedelta(days=1),
    )
    
    updates = [
        ComplaintUpdate(
            id=uuid.UUID("dddd1111-1111-1111-1111-111111111111"),
            complaint_id=complaint.id,
            update_type="STATUS_CHANGE",
            message="Complaint received. Assigned to field team for investigation.",
            created_at=now - timedelta(days=9),
        ),
        ComplaintUpdate(
            id=uuid.UUID("dddd2222-2222-2222-2222-222222222222"),
            complaint_id=complaint.id,
            update_type="PROGRESS",
            message="Field team identified faulty transformer. Repair work scheduled.",
            created_at=now - timedelta(days=1),
        ),
    ]
    
    async with get_db_context() as db:
        existing = await db.get(Complaint, complaint.id)
        if not existing:
            db.add(complaint)
            for update in updates:
                db.add(update)
        await db.commit()
    
    print(f"✅ Seeded 1 complaint with {len(updates)} updates")


async def run_seed():
    """Run all seed functions."""
    print("\n🌱 SUVIDHA 2026 - Database Seeding\n")
    
    # Initialize database connection
    connected = await init_db()
    if not connected:
        print("❌ Cannot seed - database connection failed")
        return
    
    try:
        # Seed in order (respecting foreign keys)
        users = await seed_users()
        user_id = users[0].id
        
        accounts = await seed_utility_accounts(user_id)
        await seed_bills(accounts)
        await seed_complaints(user_id)
        
        print("\n✅ Database seeding complete!\n")
    finally:
        await close_db()


if __name__ == "__main__":
    asyncio.run(run_seed())
