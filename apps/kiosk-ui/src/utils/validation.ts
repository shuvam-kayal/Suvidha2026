/**
 * Input Validation Utilities
 * Secure input sanitization and validation helpers
 */

// Phone number validation (Indian format)
export function isValidPhoneNumber(phone: string): boolean {
    const cleaned = phone.replace(/\D/g, '');
    // Indian mobile numbers: 10 digits starting with 6-9
    return /^[6-9]\d{9}$/.test(cleaned);
}

export function formatPhoneNumber(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
        return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
    }
    return phone;
}

// OTP validation
export function isValidOtp(otp: string, length: number = 6): boolean {
    return new RegExp(`^\\d{${length}}$`).test(otp);
}

// Email validation
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Ticket number validation (GRV-YYMMDD-XXXX format)
export function isValidTicketNumber(ticket: string): boolean {
    return /^GRV-\d{6}-\d{4}$/i.test(ticket);
}

// Bill number validation
export function isValidBillNumber(bill: string): boolean {
    // Format: XXXX-YYYY-NNNNNN (e.g., ELEC-2026-001234)
    return /^[A-Z]{3,4}-\d{4}-\d{6}$/i.test(bill);
}

// Amount validation
export function isValidAmount(amount: number, min: number = 1, max: number = 1000000): boolean {
    return !isNaN(amount) && amount >= min && amount <= max;
}

// Text sanitization - prevent XSS
export function sanitizeText(input: string): string {
    return input
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
        .replace(/`/g, '&#x60;')
        .trim();
}

// Sanitize for display (decode back)
export function decodeText(input: string): string {
    return input
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&#x60;/g, '`');
}

// Length validation
export function isValidLength(
    input: string,
    min: number = 0,
    max: number = 1000
): boolean {
    return input.length >= min && input.length <= max;
}

// Form validation result type
export interface ValidationResult {
    isValid: boolean;
    errors: Record<string, string>;
}

// Validate complaint form
export function validateComplaintForm(data: {
    utilityType: string;
    category: string;
    subject: string;
    description: string;
}): ValidationResult {
    const errors: Record<string, string> = {};

    if (!data.utilityType) {
        errors.utilityType = 'Please select a utility type';
    }

    if (!data.category) {
        errors.category = 'Please select a category';
    }

    if (!isValidLength(data.subject, 5, 100)) {
        errors.subject = 'Subject must be between 5 and 100 characters';
    }

    if (!isValidLength(data.description, 20, 1000)) {
        errors.description = 'Description must be between 20 and 1000 characters';
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
}

// Validate payment form
export function validatePaymentForm(data: {
    billId: string;
    amount: number;
    paymentMethod: string;
}): ValidationResult {
    const errors: Record<string, string> = {};

    if (!data.billId) {
        errors.billId = 'Bill ID is required';
    }

    if (!isValidAmount(data.amount)) {
        errors.amount = 'Please enter a valid payment amount';
    }

    if (!data.paymentMethod) {
        errors.paymentMethod = 'Please select a payment method';
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
}

// Rate limiting helper for client-side
export class RateLimiter {
    private attempts: number[] = [];
    private readonly maxAttempts: number;
    private readonly windowMs: number;

    constructor(maxAttempts: number = 5, windowMs: number = 60000) {
        this.maxAttempts = maxAttempts;
        this.windowMs = windowMs;
    }

    canAttempt(): boolean {
        const now = Date.now();
        this.attempts = this.attempts.filter(t => now - t < this.windowMs);
        return this.attempts.length < this.maxAttempts;
    }

    recordAttempt(): void {
        this.attempts.push(Date.now());
    }

    getRemainingWaitTime(): number {
        if (this.canAttempt()) return 0;
        const oldestAttempt = Math.min(...this.attempts);
        return Math.max(0, this.windowMs - (Date.now() - oldestAttempt));
    }

    reset(): void {
        this.attempts = [];
    }
}
