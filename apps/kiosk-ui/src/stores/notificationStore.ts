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
    category?: string;
    persistent?: boolean; // Persistent alerts don't auto-remove
}

interface NotificationState {
    // State
    alerts: Alert[];
    persistentAlerts: Alert[]; // Emergency alerts from REST API
    isConnected: boolean;
    socket: Socket | null;

    // Actions
    connect: () => void;
    disconnect: () => void;
    addAlert: (alert: Alert) => void;
    removeAlert: (id: string) => void;
    clearAlerts: () => void;
    fetchAlerts: () => Promise<void>;
}

// =============================================================================
// SOCKET CONFIGURATION
// =============================================================================

const API_URL = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:3000';
const SOCKET_URL = API_URL;
const MAX_ALERTS = 10;
const ALERT_TTL_MS = 30000; // 30 seconds for transient alerts

// =============================================================================
// STORE
// =============================================================================

export const useNotificationStore = create<NotificationState>((set, get) => ({
    // Initial state
    alerts: [],
    persistentAlerts: [],
    isConnected: false,
    socket: null,

    // Actions
    connect: () => {
        const currentSocket = get().socket;
        if (currentSocket?.connected) return;

        // Fetch persistent alerts on connect
        get().fetchAlerts();

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

    fetchAlerts: async () => {
        try {
            const response = await fetch(`${API_URL}/api/v1/alerts`);
            if (response.ok) {
                const data = await response.json();
                const alerts: Alert[] = (data.alerts || []).map((a: any) => ({
                    id: a.id,
                    type: a.type || 'info',
                    message: a.message,
                    timestamp: a.validFrom || new Date().toISOString(),
                    category: a.category,
                    persistent: true,
                }));
                set({ persistentAlerts: alerts });
                console.log('[Alerts] Fetched', alerts.length, 'emergency alerts');
            }
        } catch (error) {
            console.error('[Alerts] Failed to fetch alerts:', error);
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

            // Auto-remove after TTL (only for non-persistent alerts)
            if (!alert.persistent) {
                setTimeout(() => {
                    get().removeAlert(alert.id);
                }, ALERT_TTL_MS);
            }

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
export const selectPersistentAlerts = (state: NotificationState) => state.persistentAlerts;
export const selectAllAlerts = (state: NotificationState) => [...state.persistentAlerts, ...state.alerts];
export const selectIsConnected = (state: NotificationState) => state.isConnected;

