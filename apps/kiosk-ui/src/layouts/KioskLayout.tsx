/**
 * Kiosk Layout - Touch-Friendly Shell
 * Updated with auth-aware navigation
 */

import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, ArrowLeft, LogIn, LogOut } from 'lucide-react';
import LanguageSelector from '../components/LanguageSelector';
import { useAuthStore } from '../stores/authStore';
import { logout } from '../lib/api';

export default function KioskLayout() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated } = useAuthStore();

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    const canGoBack = location.pathname !== '/dashboard';

    return (
        <div className="kiosk-layout">
            {/* Header */}
            <header className="kiosk-header">
                <div className="flex items-center gap-4">
                    {canGoBack && (
                        <button
                            onClick={() => navigate(-1)}
                            className="btn-outline !min-h-12 !min-w-12 !p-3"
                            aria-label={t('common.back')}
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                    )}
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="btn-outline !min-h-12 !min-w-12 !p-3"
                        aria-label={t('common.home')}
                    >
                        <Home className="w-6 h-6" />
                    </button>
                </div>

                <div className="text-center">
                    <h1 className="text-kiosk-xl font-bold text-gradient">
                        {t('app.title')}
                    </h1>
                    <p className="text-kiosk-sm text-kiosk-muted">
                        {t('app.subtitle')}
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <LanguageSelector />

                    {isAuthenticated ? (
                        <button
                            onClick={handleLogout}
                            className="btn-outline !min-h-12 !px-4 text-red-400 border-red-400/50 hover:bg-red-400/10"
                            aria-label={t('auth.logout')}
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    ) : (
                        <button
                            onClick={() => navigate('/login')}
                            className="btn-primary !min-h-12 !px-4"
                            aria-label={t('auth.login')}
                        >
                            <LogIn className="w-5 h-5" />
                            <span className="hidden sm:inline">{t('auth.login')}</span>
                        </button>
                    )}
                </div>
            </header>

            {/* Main Content */}
            <main className="kiosk-main">
                <Outlet />
            </main>

            {/* Footer */}
            <footer className="kiosk-footer">
                <p className="text-kiosk-sm text-kiosk-muted">
                    © 2026 SUVIDHA - C-DAC Smart India Initiative
                </p>
            </footer>
        </div>
    );
}
