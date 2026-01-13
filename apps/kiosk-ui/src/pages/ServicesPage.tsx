/**
 * Services Page - Utility-Specific Actions
 * Shows available actions for selected utility type
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

const actions = [
    { id: 'pay-bill', icon: Receipt, translationKey: 'services.payBill' },
    { id: 'history', icon: History, translationKey: 'services.viewHistory' },
    { id: 'file-grievance', icon: AlertCircle, translationKey: 'services.fileGrievance' },
    { id: 'track-grievance', icon: Search, translationKey: 'services.trackGrievance' },
];

export default function ServicesPage() {
    const { type } = useParams<{ type: string }>();
    const { t } = useTranslation();
    const navigate = useNavigate();

    const ServiceIcon = serviceIcons[type || 'electricity'];
    const serviceColor = serviceColors[type || 'electricity'];

    const handleAction = (actionId: string) => {
        // TODO: Navigate to specific action pages
        console.log(`Action: ${actionId} for ${type}`);
    };

    return (
        <div className="max-w-4xl mx-auto animate-slide-up">
            {/* Service Header */}
            <div className="flex items-center justify-center gap-4 mb-10">
                <ServiceIcon className={`w-12 h-12 ${serviceColor}`} />
                <h2 className="text-kiosk-2xl font-bold">
                    {t(`services.${type}`)}
                </h2>
            </div>

            {/* Action Cards */}
            <div className="grid grid-cols-2 gap-6">
                {actions.map((action) => (
                    <button
                        key={action.id}
                        onClick={() => handleAction(action.id)}
                        className="service-tile"
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
