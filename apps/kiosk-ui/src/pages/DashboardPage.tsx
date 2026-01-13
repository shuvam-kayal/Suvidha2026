/**
 * Dashboard Page - Service Selection
 * Touch-friendly grid of utility services with auth integration
 */

import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Zap, Flame, Droplets, Building2, LogOut, User } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { logout } from '../lib/api';

const services = [
    {
        id: 'electricity',
        icon: Zap,
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-400/10',
        borderColor: 'hover:border-yellow-400',
    },
    {
        id: 'gas',
        icon: Flame,
        color: 'text-orange-400',
        bgColor: 'bg-orange-400/10',
        borderColor: 'hover:border-orange-400',
    },
    {
        id: 'water',
        icon: Droplets,
        color: 'text-blue-400',
        bgColor: 'bg-blue-400/10',
        borderColor: 'hover:border-blue-400',
    },
    {
        id: 'municipal',
        icon: Building2,
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-400/10',
        borderColor: 'hover:border-emerald-400',
    },
];

export default function DashboardPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuthStore();

    const handleServiceSelect = (serviceId: string) => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        navigate(`/services/${serviceId}`);
    };

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    return (
        <div className="max-w-5xl mx-auto animate-slide-up">
            {/* User Info Bar */}
            {isAuthenticated && user && (
                <div className="mb-8 flex items-center justify-between p-4 bg-kiosk-card rounded-kiosk-lg border border-kiosk-border">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary-600/30 flex items-center justify-center">
                            <User className="w-6 h-6 text-primary-400" />
                        </div>
                        <div>
                            <p className="text-kiosk-base font-medium">
                                {user.name || 'Welcome, Citizen'}
                            </p>
                            <p className="text-kiosk-sm text-kiosk-muted">
                                +91 {user.phoneNumber}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="btn-outline !min-h-12 !px-4 text-red-400 border-red-400/50 hover:bg-red-400/10"
                    >
                        <LogOut className="w-5 h-5" />
                        {t('auth.logout')}
                    </button>
                </div>
            )}

            {/* Title */}
            <h2 className="text-kiosk-2xl font-bold text-center mb-10">
                {t('services.title')}
            </h2>

            {/* Service Grid */}
            <div className="grid-services">
                {services.map((service) => (
                    <button
                        key={service.id}
                        onClick={() => handleServiceSelect(service.id)}
                        className={`service-tile ${service.borderColor} ${service.bgColor}`}
                    >
                        <service.icon className={`w-16 h-16 ${service.color}`} />
                        <span className="text-kiosk-lg font-semibold">
                            {t(`services.${service.id}`)}
                        </span>
                    </button>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="mt-12 flex flex-wrap justify-center gap-4">
                <button
                    className="btn-outline"
                    onClick={() => navigate('/track-grievance')}
                >
                    {t('services.trackGrievance')}
                </button>
                {!isAuthenticated && (
                    <button
                        className="btn-primary"
                        onClick={() => navigate('/login')}
                    >
                        {t('auth.login')}
                    </button>
                )}
            </div>
        </div>
    );
}
