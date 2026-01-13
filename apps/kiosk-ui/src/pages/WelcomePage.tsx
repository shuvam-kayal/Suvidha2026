/**
 * Welcome Page - Touch to Start
 * Full-screen landing with animated call-to-action
 */

import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MousePointer2 } from 'lucide-react';
import LanguageSelector from '../components/LanguageSelector';

export default function WelcomePage() {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const handleTouch = () => {
        navigate('/dashboard');
    };

    return (
        <div
            onClick={handleTouch}
            className="min-h-screen flex flex-col items-center justify-center p-8 cursor-pointer bg-gradient-to-br from-kiosk-bg via-slate-900 to-kiosk-bg"
        >
            {/* Language selector in top-right */}
            <div className="absolute top-8 right-8">
                <LanguageSelector />
            </div>

            {/* Logo/Branding */}
            <div className="text-center animate-fade-in">
                <h1 className="text-kiosk-3xl font-bold text-gradient mb-4">
                    {t('welcome.title')}
                </h1>
                <p className="text-kiosk-xl text-kiosk-muted mb-12">
                    {t('welcome.subtitle')}
                </p>
            </div>

            {/* Touch indicator */}
            <div className="flex flex-col items-center gap-4 animate-pulse-subtle">
                <div className="w-24 h-24 rounded-full bg-primary-600/20 flex items-center justify-center">
                    <MousePointer2 className="w-12 h-12 text-primary-400" />
                </div>
                <p className="text-kiosk-lg text-primary-400 font-medium">
                    {t('welcome.touchToStart')}
                </p>
            </div>

            {/* Service logos */}
            <div className="absolute bottom-8 flex items-center gap-8 text-kiosk-muted">
                <span className="text-kiosk-sm">🔌 {t('services.electricity')}</span>
                <span className="text-kiosk-sm">🔥 {t('services.gas')}</span>
                <span className="text-kiosk-sm">💧 {t('services.water')}</span>
                <span className="text-kiosk-sm">🏛️ {t('services.municipal')}</span>
            </div>
        </div>
    );
}
