/**
 * Security Logger - Audit logging for security events
 * For monitoring, alerting, and compliance
 */

type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'SECURITY';

interface LogEntry {
    timestamp: string;
    level: LogLevel;
    event: string;
    userId?: string;
    ip?: string;
    userAgent?: string;
    details?: Record<string, unknown>;
}

class SecurityLogger {
    private logs: LogEntry[] = [];
    private maxLogs: number = 1000;

    private formatEntry(entry: LogEntry): string {
        return `[${entry.timestamp}] [${entry.level}] ${entry.event}${entry.userId ? ` | User: ${entry.userId}` : ''
            }${entry.details ? ` | ${JSON.stringify(entry.details)}` : ''}`;
    }

    private log(level: LogLevel, event: string, details?: Record<string, unknown>): void {
        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            event,
            details,
        };

        this.logs.push(entry);

        // Keep logs under max limit
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(-this.maxLogs);
        }

        // Console output (in production, send to logging service)
        const formatted = this.formatEntry(entry);
        switch (level) {
            case 'ERROR':
            case 'SECURITY':
                console.error(`🔐 ${formatted}`);
                break;
            case 'WARN':
                console.warn(`⚠️ ${formatted}`);
                break;
            default:
                console.log(`📋 ${formatted}`);
        }

        // In production, send security events to alerting system
        if (level === 'SECURITY' && import.meta.env.PROD) {
            this.sendAlert(entry);
        }
    }

    private sendAlert(entry: LogEntry): void {
        // Placeholder for alerting integration
        // In production: send to Slack, PagerDuty, email, etc.
        console.log('🚨 SECURITY ALERT:', entry);
    }

    // Authentication events
    loginAttempt(userId: string, success: boolean, method: 'OTP' | 'BIOMETRIC'): void {
        this.log(
            success ? 'INFO' : 'WARN',
            success ? 'LOGIN_SUCCESS' : 'LOGIN_FAILED',
            { userId, method }
        );
    }

    loginBlocked(userId: string, reason: string): void {
        this.log('SECURITY', 'LOGIN_BLOCKED', { userId, reason });
    }

    logout(userId: string): void {
        this.log('INFO', 'LOGOUT', { userId });
    }

    sessionExpired(userId: string): void {
        this.log('INFO', 'SESSION_EXPIRED', { userId });
    }

    // OTP events
    otpRequested(phone: string): void {
        this.log('INFO', 'OTP_REQUESTED', { phone: phone.slice(-4) });
    }

    otpVerified(phone: string, success: boolean): void {
        this.log(
            success ? 'INFO' : 'WARN',
            success ? 'OTP_VERIFIED' : 'OTP_INVALID',
            { phone: phone.slice(-4) }
        );
    }

    otpRateLimited(phone: string): void {
        this.log('SECURITY', 'OTP_RATE_LIMITED', { phone: phone.slice(-4) });
    }

    // Payment events
    paymentInitiated(billId: string, amount: number, method: string): void {
        this.log('INFO', 'PAYMENT_INITIATED', { billId, amount, method });
    }

    paymentCompleted(transactionId: string, amount: number): void {
        this.log('INFO', 'PAYMENT_COMPLETED', { transactionId, amount });
    }

    paymentFailed(billId: string, reason: string): void {
        this.log('WARN', 'PAYMENT_FAILED', { billId, reason });
    }

    // Grievance events
    complaintFiled(ticketNumber: string, category: string): void {
        this.log('INFO', 'COMPLAINT_FILED', { ticketNumber, category });
    }

    complaintResolved(ticketNumber: string, resolvedBy: string): void {
        this.log('INFO', 'COMPLAINT_RESOLVED', { ticketNumber, resolvedBy });
    }

    // Security events
    suspiciousActivity(event: string, details: Record<string, unknown>): void {
        this.log('SECURITY', 'SUSPICIOUS_ACTIVITY', { event, ...details });
    }

    unauthorizedAccess(resource: string, userId?: string): void {
        this.log('SECURITY', 'UNAUTHORIZED_ACCESS', { resource, userId });
    }

    inputValidationFailed(field: string, value: string): void {
        this.log('WARN', 'VALIDATION_FAILED', {
            field,
            value: value.substring(0, 20) + (value.length > 20 ? '...' : '')
        });
    }

    // Admin events
    adminAction(adminId: string, action: string, target: string): void {
        this.log('INFO', 'ADMIN_ACTION', { adminId, action, target });
    }

    // Get recent logs
    getRecentLogs(count: number = 100, level?: LogLevel): LogEntry[] {
        let filtered = this.logs;
        if (level) {
            filtered = filtered.filter(l => l.level === level);
        }
        return filtered.slice(-count);
    }

    // Export logs for reporting
    exportLogs(): string {
        return JSON.stringify(this.logs, null, 2);
    }
}

// Singleton instance
export const securityLogger = new SecurityLogger();
export default securityLogger;
