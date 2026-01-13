/**
 * Billing Service - Bill Management & Payments
 */

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
    res.json({ status: 'healthy', service: 'billing-service' });
});

// =============================================================================
// BILLING ROUTES
// =============================================================================

// Get bills for user
app.get('/bills', async (req, res) => {
    const userId = req.headers['x-user-id'];
    const utilityType = req.query.type as string;

    // TODO: Fetch from database
    const mockBills = [
        {
            id: 'bill_001',
            utilityType: utilityType || 'ELECTRICITY',
            billNumber: 'ELEC-2026-001234',
            billDate: '2026-01-01',
            dueDate: '2026-01-15',
            amountDue: 2450.00,
            status: 'PENDING',
        },
    ];

    res.json({ bills: mockBills });
});

// Get bill details
app.get('/bills/:billId', async (req, res) => {
    const { billId } = req.params;

    // TODO: Fetch from database
    res.json({
        id: billId,
        utilityType: 'ELECTRICITY',
        billNumber: 'ELEC-2026-001234',
        billDate: '2026-01-01',
        dueDate: '2026-01-15',
        amountDue: 2450.00,
        status: 'PENDING',
        details: {
            unitsConsumed: 245,
            ratePerUnit: 8.50,
            fixedCharges: 150,
            taxes: 217.50,
        },
    });
});

// Process payment
app.post('/payments', async (req, res) => {
    const { billId, amount, paymentMethod } = req.body;

    // TODO: Implement payment gateway integration
    const transactionId = 'TXN' + Date.now();

    res.json({
        success: true,
        transactionId,
        amount,
        receiptNumber: 'RCP-' + transactionId,
        timestamp: new Date().toISOString(),
    });
});

// Get payment history
app.get('/payments/history', async (req, res) => {
    const userId = req.headers['x-user-id'];

    // TODO: Fetch from database
    res.json({
        payments: [
            {
                id: 'pay_001',
                billId: 'bill_001',
                amount: 2200.00,
                transactionId: 'TXN123456789',
                status: 'SUCCESS',
                timestamp: '2025-12-15T10:30:00Z',
            },
        ],
    });
});

app.listen(PORT, () => {
    console.log(`💳 Billing Service running on port ${PORT}`);
});

export default app;
