/**
 * Grievance Service - Complaint Management
 */

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;

app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
    res.json({ status: 'healthy', service: 'grievance-service' });
});

// Generate ticket number
function generateTicketNumber(): string {
    const prefix = 'GRV';
    const date = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const random = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${date}-${random}`;
}

// =============================================================================
// GRIEVANCE ROUTES
// =============================================================================

// File a complaint
app.post('/complaints', async (req, res) => {
    const { utilityType, category, subject, description } = req.body;
    const userId = req.headers['x-user-id'];

    // Validation
    if (!utilityType || !category || !subject || !description) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const ticketNumber = generateTicketNumber();

    // TODO: Save to database
    res.status(201).json({
        id: 'complaint_' + Date.now(),
        ticketNumber,
        status: 'OPEN',
        createdAt: new Date().toISOString(),
        message: 'Complaint registered successfully',
    });
});

// Get user's complaints
app.get('/complaints', async (req, res) => {
    const userId = req.headers['x-user-id'];

    // TODO: Fetch from database
    res.json({
        complaints: [
            {
                id: 'complaint_001',
                ticketNumber: 'GRV-260112-1234',
                utilityType: 'ELECTRICITY',
                category: 'Power Outage',
                subject: 'Frequent power cuts in area',
                status: 'IN_PROGRESS',
                priority: 'HIGH',
                createdAt: '2026-01-12T08:30:00Z',
                updatedAt: '2026-01-12T14:00:00Z',
            },
        ],
    });
});

// Get complaint by ticket number
app.get('/complaints/track/:ticketNumber', async (req, res) => {
    const { ticketNumber } = req.params;

    // TODO: Fetch from database
    res.json({
        id: 'complaint_001',
        ticketNumber,
        utilityType: 'ELECTRICITY',
        category: 'Power Outage',
        subject: 'Frequent power cuts in area',
        description: 'There have been frequent power cuts in our area for the past week.',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        createdAt: '2026-01-12T08:30:00Z',
        updatedAt: '2026-01-12T14:00:00Z',
        updates: [
            {
                id: 'update_001',
                message: 'Complaint received and assigned to field team',
                timestamp: '2026-01-12T09:00:00Z',
            },
            {
                id: 'update_002',
                message: 'Investigation in progress',
                timestamp: '2026-01-12T14:00:00Z',
            },
        ],
    });
});

// Add update to complaint (Admin)
app.post('/complaints/:complaintId/updates', async (req, res) => {
    const { complaintId } = req.params;
    const { message, status } = req.body;

    // TODO: Save to database
    res.json({
        id: 'update_' + Date.now(),
        complaintId,
        message,
        status,
        timestamp: new Date().toISOString(),
    });
});

app.listen(PORT, () => {
    console.log(`📋 Grievance Service running on port ${PORT}`);
});

export default app;
