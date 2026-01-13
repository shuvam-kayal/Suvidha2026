/**
 * Grievance Service - Complaint Management
 * SUVIDHA 2026 - C-DAC Hackathon
 */

import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;

app.use(helmet());
app.use(cors());
app.use(express.json());

// Request logging
app.use((req: Request, _res: Response, next: NextFunction) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// =============================================================================
// TYPES & MOCK DATA
// =============================================================================

type UtilityType = 'ELECTRICITY' | 'GAS' | 'WATER' | 'MUNICIPAL';
type ComplaintStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'ESCALATED';
type ComplaintPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

interface Complaint {
    id: string;
    ticketNumber: string;
    userId: string;
    utilityType: UtilityType;
    category: string;
    subject: string;
    description: string;
    status: ComplaintStatus;
    priority: ComplaintPriority;
    createdAt: string;
    updatedAt: string;
    resolvedAt?: string;
    updates: ComplaintUpdate[];
}

interface ComplaintUpdate {
    id: string;
    message: string;
    createdBy: string;
    createdAt: string;
}

// Categories by utility type
const categories: Record<UtilityType, string[]> = {
    ELECTRICITY: ['Power Outage', 'Meter Issue', 'Billing Dispute', 'New Connection', 'Voltage Fluctuation'],
    GAS: ['Gas Leak', 'Low Pressure', 'Meter Issue', 'Billing Dispute', 'New Connection'],
    WATER: ['No Water Supply', 'Low Pressure', 'Water Quality', 'Leakage', 'Billing Dispute'],
    MUNICIPAL: ['Street Light', 'Road Damage', 'Garbage Collection', 'Drainage Issue', 'Property Tax'],
};

// Mock complaints database
const complaints: Complaint[] = [
    {
        id: 'comp_001',
        ticketNumber: 'GRV-260112-1234',
        userId: 'user_1234',
        utilityType: 'ELECTRICITY',
        category: 'Power Outage',
        subject: 'Frequent power cuts in area',
        description: 'There have been frequent power cuts in our area for the past week. Power goes off 5-6 times daily for 30 minutes each.',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        createdAt: '2026-01-12T08:30:00Z',
        updatedAt: '2026-01-13T14:00:00Z',
        updates: [
            {
                id: 'upd_001',
                message: 'Complaint received. Assigned to field team for investigation.',
                createdBy: 'System',
                createdAt: '2026-01-12T09:00:00Z',
            },
            {
                id: 'upd_002',
                message: 'Field team identified faulty transformer. Repair work scheduled.',
                createdBy: 'Field Engineer',
                createdAt: '2026-01-13T14:00:00Z',
            },
        ],
    },
];

// Generate ticket number
function generateTicketNumber(): string {
    const prefix = 'GRV';
    const date = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const random = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${date}-${random}`;
}

// =============================================================================
// HEALTH CHECK
// =============================================================================

app.get('/health', (_req: Request, res: Response) => {
    res.json({
        status: 'healthy',
        service: 'grievance-service',
        timestamp: new Date().toISOString(),
    });
});

// =============================================================================
// GET CATEGORIES
// =============================================================================

app.get('/categories', (req: Request, res: Response) => {
    const utilityType = (req.query.utility as string)?.toUpperCase() as UtilityType;

    if (utilityType && categories[utilityType]) {
        res.json({
            success: true,
            categories: categories[utilityType],
        });
    } else {
        res.json({
            success: true,
            categories: categories,
        });
    }
});

// =============================================================================
// FILE NEW COMPLAINT
// =============================================================================

app.post('/complaints', (req: Request, res: Response) => {
    try {
        const { utilityType, category, subject, description } = req.body;
        const userId = req.headers['x-user-id'] as string || 'anonymous';

        // Validation
        if (!utilityType || !category || !subject || !description) {
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['utilityType', 'category', 'subject', 'description'],
            });
        }

        if (description.length < 20) {
            return res.status(400).json({
                error: 'Description too short',
                message: 'Please provide at least 20 characters describing your issue',
            });
        }

        const ticketNumber = generateTicketNumber();
        const now = new Date().toISOString();

        const newComplaint: Complaint = {
            id: 'comp_' + Date.now(),
            ticketNumber,
            userId,
            utilityType: utilityType.toUpperCase() as UtilityType,
            category,
            subject,
            description,
            status: 'OPEN',
            priority: 'MEDIUM',
            createdAt: now,
            updatedAt: now,
            updates: [
                {
                    id: 'upd_' + Date.now(),
                    message: 'Complaint registered successfully. Our team will review your complaint shortly.',
                    createdBy: 'System',
                    createdAt: now,
                },
            ],
        };

        complaints.push(newComplaint);

        console.log(`📋 New complaint registered: ${ticketNumber}`);

        res.status(201).json({
            success: true,
            ticketNumber,
            message: 'Complaint registered successfully',
            complaint: {
                id: newComplaint.id,
                ticketNumber: newComplaint.ticketNumber,
                status: newComplaint.status,
                createdAt: newComplaint.createdAt,
            },
        });
    } catch (error) {
        console.error('Create complaint error:', error);
        res.status(500).json({ error: 'Failed to register complaint' });
    }
});

// =============================================================================
// GET USER'S COMPLAINTS
// =============================================================================

app.get('/complaints', (req: Request, res: Response) => {
    try {
        const userId = req.headers['x-user-id'] as string;
        const status = req.query.status as string | undefined;
        const utilityType = req.query.utility as string | undefined;

        let filtered = [...complaints];

        // Filter by user (in production)
        // if (userId) {
        //   filtered = filtered.filter(c => c.userId === userId);
        // }

        if (status) {
            filtered = filtered.filter(c => c.status === status.toUpperCase());
        }

        if (utilityType) {
            filtered = filtered.filter(c => c.utilityType === utilityType.toUpperCase());
        }

        // Sort by most recent
        filtered.sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        res.json({
            success: true,
            complaints: filtered.map(c => ({
                id: c.id,
                ticketNumber: c.ticketNumber,
                utilityType: c.utilityType,
                category: c.category,
                subject: c.subject,
                status: c.status,
                priority: c.priority,
                createdAt: c.createdAt,
                updatedAt: c.updatedAt,
            })),
            total: filtered.length,
        });
    } catch (error) {
        console.error('Get complaints error:', error);
        res.status(500).json({ error: 'Failed to fetch complaints' });
    }
});

// =============================================================================
// TRACK COMPLAINT BY TICKET NUMBER
// =============================================================================

app.get('/complaints/track/:ticketNumber', (req: Request, res: Response) => {
    try {
        const { ticketNumber } = req.params;

        const complaint = complaints.find(
            c => c.ticketNumber.toUpperCase() === ticketNumber.toUpperCase()
        );

        if (!complaint) {
            return res.status(404).json({
                error: 'Complaint not found',
                message: 'No complaint found with this ticket number',
            });
        }

        res.json({
            success: true,
            complaint,
        });
    } catch (error) {
        console.error('Track complaint error:', error);
        res.status(500).json({ error: 'Failed to track complaint' });
    }
});

// =============================================================================
// GET COMPLAINT DETAILS
// =============================================================================

app.get('/complaints/:complaintId', (req: Request, res: Response) => {
    try {
        const { complaintId } = req.params;

        const complaint = complaints.find(c => c.id === complaintId);

        if (!complaint) {
            return res.status(404).json({ error: 'Complaint not found' });
        }

        res.json({
            success: true,
            complaint,
        });
    } catch (error) {
        console.error('Get complaint error:', error);
        res.status(500).json({ error: 'Failed to fetch complaint' });
    }
});

// =============================================================================
// START SERVER
// =============================================================================

app.listen(PORT, () => {
    console.log(`\n📋 Grievance Service running on port ${PORT}`);
    console.log(`📊 Mock complaints loaded: ${complaints.length}`);
});

export default app;
