/**
 * Notification System - For complaint updates and alerts
 * Can be integrated with push notifications, email, or SMS
 */

type NotificationType = 'COMPLAINT_UPDATE' | 'PAYMENT_SUCCESS' | 'PAYMENT_FAILED' | 'SYSTEM_ALERT';

interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    timestamp: string;
    read: boolean;
    data?: Record<string, unknown>;
}

class NotificationService {
    private notifications: Notification[] = [];
    private listeners: Set<(notifications: Notification[]) => void> = new Set();

    // Subscribe to notification updates
    subscribe(callback: (notifications: Notification[]) => void): () => void {
        this.listeners.add(callback);
        callback(this.notifications);
        return () => this.listeners.delete(callback);
    }

    private notify(): void {
        this.listeners.forEach(callback => callback([...this.notifications]));
    }

    // Add a new notification
    push(type: NotificationType, title: string, message: string, data?: Record<string, unknown>): void {
        const notification: Notification = {
            id: 'notif_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
            type,
            title,
            message,
            timestamp: new Date().toISOString(),
            read: false,
            data,
        };

        this.notifications.unshift(notification);

        // Keep only last 50 notifications
        if (this.notifications.length > 50) {
            this.notifications = this.notifications.slice(0, 50);
        }

        this.notify();

        // Show browser notification if permitted
        this.showBrowserNotification(title, message);
    }

    // Mark notification as read
    markAsRead(id: string): void {
        const notification = this.notifications.find(n => n.id === id);
        if (notification) {
            notification.read = true;
            this.notify();
        }
    }

    // Mark all as read
    markAllAsRead(): void {
        this.notifications.forEach(n => n.read = true);
        this.notify();
    }

    // Get unread count
    getUnreadCount(): number {
        return this.notifications.filter(n => !n.read).length;
    }

    // Get all notifications
    getAll(): Notification[] {
        return [...this.notifications];
    }

    // Clear all notifications
    clear(): void {
        this.notifications = [];
        this.notify();
    }

    // Browser notification support
    private async showBrowserNotification(title: string, message: string): Promise<void> {
        if (!('Notification' in window)) return;

        if (Notification.permission === 'granted') {
            new Notification(title, { body: message, icon: '/favicon.ico' });
        } else if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                new Notification(title, { body: message, icon: '/favicon.ico' });
            }
        }
    }

    // Helper methods for common notifications
    notifyComplaintUpdate(ticketNumber: string, status: string, message: string): void {
        this.push(
            'COMPLAINT_UPDATE',
            `Complaint ${ticketNumber} Updated`,
            message,
            { ticketNumber, status }
        );
    }

    notifyPaymentSuccess(transactionId: string, amount: number): void {
        this.push(
            'PAYMENT_SUCCESS',
            'Payment Successful',
            `Your payment of ₹${amount.toLocaleString()} was successful. Transaction ID: ${transactionId}`,
            { transactionId, amount }
        );
    }

    notifyPaymentFailed(billNumber: string, reason: string): void {
        this.push(
            'PAYMENT_FAILED',
            'Payment Failed',
            `Payment for bill ${billNumber} failed: ${reason}`,
            { billNumber, reason }
        );
    }

    notifySystemAlert(message: string): void {
        this.push('SYSTEM_ALERT', 'System Alert', message);
    }
}

// Singleton instance
export const notificationService = new NotificationService();
export default notificationService;
export type { Notification, NotificationType };
