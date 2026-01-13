/**
 * SUVIDHA 2026 - Shared Type Definitions
 */

// =============================================================================
// USER & AUTH
// =============================================================================

export interface User {
    id: string;
    phoneNumber: string;
    email?: string;
    fullName: string;
    createdAt: string;
    isActive: boolean;
}

export interface AuthTokens {
    token: string;
    refreshToken: string;
    expiresIn: number;
}

export interface OtpRequest {
    phoneNumber: string;
}

export interface OtpVerify {
    phoneNumber: string;
    otp: string;
}

// =============================================================================
// BILLING
// =============================================================================

export type UtilityType = 'ELECTRICITY' | 'GAS' | 'WATER' | 'MUNICIPAL';

export type BillStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'PARTIALLY_PAID';

export interface UtilityAccount {
    id: string;
    userId: string;
    utilityType: UtilityType;
    accountNumber: string;
    connectionAddress: string;
    isActive: boolean;
}

export interface Bill {
    id: string;
    accountId: string;
    billNumber: string;
    billDate: string;
    dueDate: string;
    amountDue: number;
    amountPaid: number;
    status: BillStatus;
    details?: BillDetails;
}

export interface BillDetails {
    unitsConsumed?: number;
    ratePerUnit?: number;
    fixedCharges?: number;
    taxes?: number;
}

export type PaymentStatus = 'SUCCESS' | 'FAILED' | 'PENDING' | 'REFUNDED';

export interface Payment {
    id: string;
    billId: string;
    amount: number;
    paymentMethod: string;
    transactionId: string;
    status: PaymentStatus;
    timestamp: string;
}

// =============================================================================
// GRIEVANCE
// =============================================================================

export type ComplaintStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'ESCALATED';
export type ComplaintPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Complaint {
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
}

export interface ComplaintUpdate {
    id: string;
    complaintId: string;
    updateType: string;
    message: string;
    createdBy?: string;
    createdAt: string;
}

// =============================================================================
// API RESPONSES
// =============================================================================

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}
