/**
 * Services Page - Utility-Specific Actions
 * Navigate to bills, payments, and grievances
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Receipt,
    History,
    AlertCircle,
    Search,
    Zap,
    Flame,
    Droplets,
    Building2,
} from 'lucide-react';

const serviceIcons: Record<string, typeof Zap> = {
    electricity: Zap,
    gas: Flame,
    water: Droplets,
    municipal: Building2,
};

const serviceColors: Record<string, string> = {
    electricity: 'text-yellow-400',
    gas: 'text-orange-400',
    water: 'text-blue-400',
    municipal: 'text-emerald-400',
};

const serviceBgColors: Record<string, string> = {
    electricity: 'bg-yellow-400/10',
    gas: 'bg-orange-400/10',
    water: 'bg-blue-400/10',
    municipal: 'bg-emerald-400/10',
};

interface Action {
    id: string;
    icon: typeof Receipt;
    translationKey: string;
    route: (type: string) => string;
}

const actions: Action[] = [
    {
        id: 'pay-bill',
        icon: Receipt,
        translationKey: 'services.payBill',
        route: (type) => `/bills/${type}`,
    },
    {
        id: 'history',
        icon: History,
        translationKey: 'services.viewHistory',
        route: (type) => `/bills/${type}?status=paid`,
    },
    {
        id: 'file-grievance',
        icon: AlertCircle,
        translationKey: 'services.fileGrievance',
        route: (type) => `/grievance/new?utility=${type}`,
    },
    {
        id: 'track-grievance',
        icon: Search,
        translationKey: 'services.trackGrievance',
        route: () => '/grievance/track',
    },
];

export default function ServicesPage() {
    const { type } = useParams<{ type: string }>();
    const { t } = useTranslation();
    const navigate = useNavigate();

    const utilityType = type || 'electricity';
    const ServiceIcon = serviceIcons[utilityType] || Zap;
    const serviceColor = serviceColors[utilityType] || 'text-yellow-400';
    const serviceBgColor = serviceBgColors[utilityType] || 'bg-yellow-400/10';

    const handleAction = (action: Action) => {
        navigate(action.route(utilityType));
    };

    return (
        <div className="max-w-4xl mx-auto animate-slide-up">
            {/* Service Header */}
            <div className="flex items-center justify-center gap-4 mb-10">
                <div className={`w-16 h-16 rounded-full ${serviceBgColor} flex items-center justify-center`}>
                    <ServiceIcon className={`w-10 h-10 ${serviceColor}`} />
                </div>
                <h2 className="text-kiosk-2xl font-bold">
                    {t(`services.${utilityType}`)}
                </h2>
            </div>

            {/* Action Cards */}
            <div className="grid grid-cols-2 gap-6">
                {actions.map((action) => (
                    <button
                        key={action.id}
                        onClick={() => handleAction(action)}
                        className="service-tile hover:border-primary-500"
                    >
                        <action.icon className="w-12 h-12 text-primary-400" />
                        <span className="text-kiosk-lg font-semibold">
                            {t(action.translationKey)}
                        </span>
                    </button>
                ))}
            </div>

            {/* Back to Dashboard */}
            <div className="mt-10 flex justify-center">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="btn-outline"
                >
                    {t('common.back')}
                </button>
            </div>
        </div>
    );
}
