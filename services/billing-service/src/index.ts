/**
 * Billing Service - Bill Management & Payments
 * SUVIDHA 2026 - C-DAC Hackathon
 */

import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

app.use(helmet());
app.use(cors());
app.use(express.json());

// Request logging
app.use((req: Request, _res: Response, next: NextFunction) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// =============================================================================
// MOCK DATA (Replace with PostgreSQL in production)
// =============================================================================

interface Bill {
    id: string;
    accountId: string;
    utilityType: 'ELECTRICITY' | 'GAS' | 'WATER' | 'MUNICIPAL';
    billNumber: string;
    billDate: string;
    dueDate: string;
    amountDue: number;
    amountPaid: number;
    status: 'PENDING' | 'PAID' | 'OVERDUE' | 'PARTIALLY_PAID';
    details: {
        unitsConsumed?: number;
        ratePerUnit?: number;
        fixedCharges: number;
        taxes: number;
        previousBalance?: number;
    };
}

interface Payment {
    id: string;
    billId: string;
    amount: number;
    paymentMethod: string;
    transactionId: string;
    status: 'SUCCESS' | 'FAILED' | 'PENDING';
    timestamp: string;
}

// Mock bills database
const mockBills: Bill[] = [
    {
        id: 'bill_elec_001',
        accountId: 'acc_elec_001',
        utilityType: 'ELECTRICITY',
        billNumber: 'ELEC-2026-001234',
        billDate: '2026-01-01',
        dueDate: '2026-01-20',
        amountDue: 2450.00,
        amountPaid: 0,
        status: 'PENDING',
        details: {
            unitsConsumed: 245,
            ratePerUnit: 8.50,
            fixedCharges: 150,
            taxes: 217.50,
        },
    },
    {
        id: 'bill_gas_001',
        accountId: 'acc_gas_001',
        utilityType: 'GAS',
        billNumber: 'GAS-2026-005678',
        billDate: '2026-01-05',
        dueDate: '2026-01-25',
        amountDue: 850.00,
        amountPaid: 0,
        status: 'PENDING',
        details: {
            unitsConsumed: 42,
            ratePerUnit: 18.00,
            fixedCharges: 75,
            taxes: 19.00,
        },
    },
    {
        id: 'bill_water_001',
        accountId: 'acc_water_001',
        utilityType: 'WATER',
        billNumber: 'WTR-2026-009012',
        billDate: '2026-01-03',
        dueDate: '2026-01-23',
        amountDue: 520.00,
        amountPaid: 0,
        status: 'PENDING',
        details: {
            unitsConsumed: 12000, // liters
            ratePerUnit: 0.035,
            fixedCharges: 50,
            taxes: 50.00,
        },
    },
    {
        id: 'bill_muni_001',
        accountId: 'acc_muni_001',
        utilityType: 'MUNICIPAL',
        billNumber: 'MUN-2026-012345',
        billDate: '2025-12-15',
        dueDate: '2026-01-15',
        amountDue: 3200.00,
        amountPaid: 0,
        status: 'OVERDUE',
        details: {
            fixedCharges: 2800,
            taxes: 400,
            previousBalance: 0,
        },
    },
];

const payments: Payment[] = [];

// =============================================================================
// HEALTH CHECK
// =============================================================================

app.get('/health', (_req: Request, res: Response) => {
    res.json({
        status: 'healthy',
        service: 'billing-service',
        timestamp: new Date().toISOString(),
    });
});

// =============================================================================
// GET BILLS
// =============================================================================

app.get('/bills', (req: Request, res: Response) => {
    try {
        const utilityType = req.query.type as string | undefined;
        const status = req.query.status as string | undefined;

        let filteredBills = [...mockBills];

        if (utilityType) {
            filteredBills = filteredBills.filter(
                b => b.utilityType === utilityType.toUpperCase()
            );
        }

        if (status) {
            filteredBills = filteredBills.filter(
                b => b.status === status.toUpperCase()
            );
        }

        // Return summary view
        const billSummaries = filteredBills.map(bill => ({
            id: bill.id,
            utilityType: bill.utilityType,
            billNumber: bill.billNumber,
            dueDate: bill.dueDate,
            amountDue: bill.amountDue,
            status: bill.status,
        }));

        res.json({
            success: true,
            bills: billSummaries,
            total: billSummaries.length,
        });
    } catch (error) {
        console.error('Get bills error:', error);
        res.status(500).json({ error: 'Failed to fetch bills' });
    }
});

// =============================================================================
// GET BILL DETAILS
// =============================================================================

app.get('/bills/:billId', (req: Request, res: Response) => {
    try {
        const { billId } = req.params;
        const bill = mockBills.find(b => b.id === billId);

        if (!bill) {
            return res.status(404).json({ error: 'Bill not found' });
        }

        // Get payment history for this bill
        const billPayments = payments.filter(p => p.billId === billId);

        res.json({
            success: true,
            bill: {
                ...bill,
                payments: billPayments,
            },
        });
    } catch (error) {
        console.error('Get bill details error:', error);
        res.status(500).json({ error: 'Failed to fetch bill details' });
    }
});

// =============================================================================
// PROCESS PAYMENT
// =============================================================================

app.post('/payments', (req: Request, res: Response) => {
    try {
        const { billId, amount, paymentMethod } = req.body;

        // Validation
        if (!billId || !amount || !paymentMethod) {
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['billId', 'amount', 'paymentMethod'],
            });
        }

        const bill = mockBills.find(b => b.id === billId);
        if (!bill) {
            return res.status(404).json({ error: 'Bill not found' });
        }

        if (amount <= 0) {
            return res.status(400).json({ error: 'Invalid payment amount' });
        }

        const remaining = bill.amountDue - bill.amountPaid;
        if (amount > remaining) {
            return res.status(400).json({
                error: 'Amount exceeds balance due',
                balanceDue: remaining,
            });
        }

        // Generate transaction ID
        const transactionId = 'TXN' + Date.now().toString(36).toUpperCase() +
            Math.random().toString(36).slice(2, 6).toUpperCase();

        // Create payment record
        const payment: Payment = {
            id: 'pay_' + Date.now(),
            billId,
            amount,
            paymentMethod,
            transactionId,
            status: 'SUCCESS',
            timestamp: new Date().toISOString(),
        };

        payments.push(payment);

        // Update bill
        bill.amountPaid += amount;
        if (bill.amountPaid >= bill.amountDue) {
            bill.status = 'PAID';
        } else {
            bill.status = 'PARTIALLY_PAID';
        }

        // Generate receipt
        const receipt = {
            receiptNumber: 'RCP-' + transactionId,
            transactionId,
            billNumber: bill.billNumber,
            utilityType: bill.utilityType,
            amountPaid: amount,
            paymentMethod,
            paymentDate: payment.timestamp,
            remainingBalance: bill.amountDue - bill.amountPaid,
            status: 'SUCCESS',
        };

        console.log(`✅ Payment processed: ${transactionId} - ₹${amount}`);

        res.json({
            success: true,
            payment,
            receipt,
            message: 'Payment processed successfully',
        });
    } catch (error) {
        console.error('Payment error:', error);
        res.status(500).json({ error: 'Payment processing failed' });
    }
});

// =============================================================================
// GET PAYMENT HISTORY
// =============================================================================

app.get('/payments/history', (req: Request, res: Response) => {
    try {
        const billId = req.query.billId as string | undefined;

        let filteredPayments = [...payments];

        if (billId) {
            filteredPayments = filteredPayments.filter(p => p.billId === billId);
        }

        // Sort by most recent first
        filteredPayments.sort((a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        res.json({
            success: true,
            payments: filteredPayments,
            total: filteredPayments.length,
        });
    } catch (error) {
        console.error('Payment history error:', error);
        res.status(500).json({ error: 'Failed to fetch payment history' });
    }
});

// =============================================================================
// GET PAYMENT RECEIPT
// =============================================================================

app.get('/payments/:paymentId/receipt', (req: Request, res: Response) => {
    try {
        const { paymentId } = req.params;
        const payment = payments.find(p => p.id === paymentId);

        if (!payment) {
            return res.status(404).json({ error: 'Payment not found' });
        }

        const bill = mockBills.find(b => b.id === payment.billId);

        res.json({
            success: true,
            receipt: {
                receiptNumber: 'RCP-' + payment.transactionId,
                transactionId: payment.transactionId,
                billNumber: bill?.billNumber,
                utilityType: bill?.utilityType,
                amountPaid: payment.amount,
                paymentMethod: payment.paymentMethod,
                paymentDate: payment.timestamp,
                status: payment.status,
            },
        });
    } catch (error) {
        console.error('Get receipt error:', error);
        res.status(500).json({ error: 'Failed to fetch receipt' });
    }
});

// =============================================================================
// START SERVER
// =============================================================================

app.listen(PORT, () => {
    console.log(`\n💳 Billing Service running on port ${PORT}`);
    console.log(`📊 Mock bills loaded: ${mockBills.length}`);
});

export default app;
