/**
 * Dashboard Page - Unified Service Selection
 * Touch-friendly grid with service toggle and global state
 */

import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Zap, Flame, Droplets, Building2, LogOut, User, Check } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useServiceStore, ServiceType } from '../stores/serviceStore';
import { logout } from '../lib/api';

const services: Array<{
    id: Exclude<ServiceType, null>;
    icon: typeof Zap;
    color: string;
    bgColor: string;
    borderColor: string;
    activeGlow: string;
}> = [
        {
            id: 'electricity',
            icon: Zap,
            color: 'text-yellow-400',
            bgColor: 'bg-yellow-400/10',
            borderColor: 'border-yellow-400',
            activeGlow: 'shadow-[0_0_30px_rgba(250,204,21,0.5)]',
        },
        {
            id: 'water',
            icon: Droplets,
            color: 'text-blue-400',
            bgColor: 'bg-blue-400/10',
            borderColor: 'border-blue-400',
            activeGlow: 'shadow-[0_0_30px_rgba(96,165,250,0.5)]',
        },
        {
            id: 'gas',
            icon: Flame,
            color: 'text-orange-400',
            bgColor: 'bg-orange-400/10',
            borderColor: 'border-orange-400',
            activeGlow: 'shadow-[0_0_30px_rgba(251,146,60,0.5)]',
        },
        {
            id: 'municipal',
            icon: Building2,
            color: 'text-emerald-400',
            bgColor: 'bg-emerald-400/10',
            borderColor: 'border-emerald-400',
            activeGlow: 'shadow-[0_0_30px_rgba(52,211,153,0.5)]',
        },
    ];

export default function DashboardPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuthStore();
    const { activeService, toggleService } = useServiceStore();

    const handleServiceToggle = (serviceId: Exclude<ServiceType, null>) => {
        toggleService(serviceId);
    };

    const handleServiceAction = (serviceId: string) => {
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

            {/* Title with active service indicator */}
            <div className="text-center mb-8">
                <h2 className="text-kiosk-2xl font-bold mb-2">
                    {t('services.title')}
                </h2>
                {activeService && (
                    <p className="text-kiosk-base text-primary-400">
                        {t('services.currentlySelected', 'Currently selected')}: {t(`services.${activeService}`)}
                    </p>
                )}
            </div>

            {/* Service Toggle Cards - Unified Interface */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {services.map((service) => {
                    const isActive = activeService === service.id;
                    return (
                        <button
                            key={service.id}
                            onClick={() => handleServiceToggle(service.id)}
                            className={`
                                relative p-6 rounded-kiosk-xl border-2 transition-all duration-300
                                flex flex-col items-center justify-center gap-3
                                min-h-[140px]
                                ${isActive
                                    ? `${service.bgColor} ${service.borderColor} ${service.activeGlow}`
                                    : 'bg-kiosk-card border-kiosk-border hover:border-primary-500/50'
                                }
                                ${isActive ? 'scale-[1.02]' : 'hover:scale-[1.01]'}
                            `}
                        >
                            {/* Active indicator */}
                            {isActive && (
                                <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                                    <Check className="w-4 h-4 text-white" />
                                </div>
                            )}

                            <service.icon className={`w-12 h-12 ${service.color}`} />
                            <span className="text-kiosk-base font-semibold">
                                {t(`services.${service.id}`)}
                            </span>

                            {isActive && (
                                <span className="text-xs text-kiosk-muted">
                                    {t('services.tapToDeselect', 'Tap to deselect')}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Action Button - Go to selected service */}
            {activeService && (
                <div className="flex justify-center mb-8">
                    <button
                        onClick={() => handleServiceAction(activeService)}
                        className="btn-primary !min-h-14 !px-12 text-lg"
                    >
                        {t('services.goTo', 'Go to')} {t(`services.${activeService}`)}
                    </button>
                </div>
            )}

            {/* Quick Actions */}
            <div className="flex flex-wrap justify-center gap-4">
                <button
                    className="btn-outline"
                    onClick={() => navigate('/grievance/track')}
                >
                    {t('services.trackGrievance')}
                </button>
                {activeService && (
                    <button
                        className="btn-outline"
                        onClick={() => navigate('/grievance/new')}
                    >
                        {t('services.fileComplaint', 'File Complaint')}
                    </button>
                )}
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

