/**
 * NewsTicker - Real-time Alert Marquee
 * Fixed position at bottom of screen with scrolling notifications
 * Displays both persistent alerts (from REST API) and real-time notifications (WebSocket)
 */

import { useEffect, useMemo } from 'react';
import { AlertTriangle, Info, CheckCircle, Bell, Wifi, WifiOff, CloudRain, Wrench, Megaphone } from 'lucide-react';
import { useNotificationStore, Alert } from '../stores/notificationStore';

const iconMap: Record<string, any> = {
    info: Info,
    warning: AlertTriangle,
    alert: Bell,
    success: CheckCircle,
};

// Category-specific icons for emergency alerts
const categoryIconMap: Record<string, any> = {
    WEATHER: CloudRain,
    MAINTENANCE: Wrench,
    ANNOUNCEMENT: Megaphone,
    SERVICE: CheckCircle,
};

const colorMap: Record<string, string> = {
    info: 'text-blue-400 bg-blue-500/20',
    warning: 'text-yellow-400 bg-yellow-500/20',
    alert: 'text-red-400 bg-red-500/20',
    success: 'text-green-400 bg-green-500/20',
};

function AlertItem({ alert }: { alert: Alert }) {
    // Use category-specific icon if available
    const Icon = (alert.category && categoryIconMap[alert.category]) || iconMap[alert.type] || Info;
    const colorClass = colorMap[alert.type] || colorMap.info;

    return (
        <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full ${colorClass} mr-8`}>
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span className="whitespace-nowrap font-medium">{alert.message}</span>
        </span>
    );
}

export default function NewsTicker() {
    const isConnected = useNotificationStore((state) => state.isConnected);
    const alerts = useNotificationStore((state) => state.alerts);
    const persistentAlerts = useNotificationStore((state) => state.persistentAlerts);
    const connect = useNotificationStore((state) => state.connect);
    const disconnect = useNotificationStore((state) => state.disconnect);

    // Memoize combined alerts to prevent re-renders
    const allAlerts = useMemo(() => [
        ...persistentAlerts,
        ...alerts
    ], [persistentAlerts, alerts]);

    // Connect to socket on mount (empty deps - run once)
    useEffect(() => {
        connect();
        return () => {
            disconnect();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Don't render if no alerts
    if (allAlerts.length === 0) {
        return (
            <div className="fixed bottom-0 left-0 right-0 z-40 bg-kiosk-bg/90 backdrop-blur-sm border-t border-kiosk-border">
                <div className="h-10 flex items-center justify-between px-4">
                    <span className="text-kiosk-sm text-kiosk-muted flex items-center gap-2">
                        {isConnected ? (
                            <>
                                <Wifi className="w-4 h-4 text-green-400" />
                                Live updates active
                            </>
                        ) : (
                            <>
                                <WifiOff className="w-4 h-4 text-red-400" />
                                Connecting...
                            </>
                        )}
                    </span>
                    <span className="text-kiosk-xs text-kiosk-muted">
                        © 2026 SUVIDHA - C-DAC
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-r from-kiosk-bg via-kiosk-card to-kiosk-bg border-t border-kiosk-border overflow-hidden">
            <div className="h-12 flex items-center">
                {/* Connection status indicator */}
                <div className="flex-shrink-0 px-3 border-r border-kiosk-border">
                    {isConnected ? (
                        <Wifi className="w-5 h-5 text-green-400 animate-pulse" />
                    ) : (
                        <WifiOff className="w-5 h-5 text-red-400" />
                    )}
                </div>

                {/* Scrolling alerts */}
                <div className="flex-1 overflow-hidden">
                    <div className="animate-marquee inline-flex items-center">
                        {/* Duplicate alerts for seamless loop */}
                        {allAlerts.map((alert: Alert) => (
                            <AlertItem key={alert.id} alert={alert} />
                        ))}
                        {allAlerts.map((alert: Alert) => (
                            <AlertItem key={`${alert.id}-dup`} alert={alert} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
