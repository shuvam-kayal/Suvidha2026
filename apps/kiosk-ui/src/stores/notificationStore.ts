/**
 * Notification Store - Real-time Alerts
 * Manages Socket.io connection and alert state
 */

import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

// =============================================================================
// TYPES
// =============================================================================

export interface Alert {
    id: string;
    type: 'info' | 'warning' | 'alert' | 'success';
    message: string;
    timestamp: string;
    priority?: number;
}

interface NotificationState {
    // State
    alerts: Alert[];
    isConnected: boolean;
    socket: Socket | null;

    // Actions
    connect: () => void;
    disconnect: () => void;
    addAlert: (alert: Alert) => void;
    removeAlert: (id: string) => void;
    clearAlerts: () => void;
}

// =============================================================================
// SOCKET CONFIGURATION
// =============================================================================

const SOCKET_URL = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:3000';
const MAX_ALERTS = 5;
const ALERT_TTL_MS = 30000; // 30 seconds

// =============================================================================
// STORE
// =============================================================================

export const useNotificationStore = create<NotificationState>((set, get) => ({
    // Initial state
    alerts: [],
    isConnected: false,
    socket: null,

    // Actions
    connect: () => {
        const currentSocket = get().socket;
        if (currentSocket?.connected) return;

        const socket = io(SOCKET_URL, {
            transports: ['websocket', 'polling'],
            autoConnect: true,
        });

        socket.on('connect', () => {
            console.log('[Socket.io] Connected to notification service');
            set({ isConnected: true });
        });

        socket.on('disconnect', () => {
            console.log('[Socket.io] Disconnected from notification service');
            set({ isConnected: false });
        });

        socket.on('notification', (alert: Alert) => {
            console.log('[Socket.io] Received notification:', alert);
            get().addAlert(alert);
        });

        socket.on('connect_error', (error) => {
            console.error('[Socket.io] Connection error:', error);
        });

        set({ socket });
    },

    disconnect: () => {
        const socket = get().socket;
        if (socket) {
            socket.disconnect();
            set({ socket: null, isConnected: false });
        }
    },

    addAlert: (alert) => {
        set((state) => {
            // Avoid duplicate alerts
            if (state.alerts.some((a) => a.id === alert.id)) {
                return state;
            }

            // Add new alert, keep max limit
            const newAlerts = [alert, ...state.alerts].slice(0, MAX_ALERTS);

            // Auto-remove after TTL
            setTimeout(() => {
                get().removeAlert(alert.id);
            }, ALERT_TTL_MS);

            return { alerts: newAlerts };
        });
    },

    removeAlert: (id) => {
        set((state) => ({
            alerts: state.alerts.filter((a) => a.id !== id),
        }));
    },

    clearAlerts: () => {
        set({ alerts: [] });
    },
}));

// =============================================================================
// SELECTORS
// =============================================================================

export const selectAlerts = (state: NotificationState) => state.alerts;
export const selectIsConnected = (state: NotificationState) => state.isConnected;
