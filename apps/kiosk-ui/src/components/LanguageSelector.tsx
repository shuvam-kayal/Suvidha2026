/**
 * Language Selector Component
 * Touch-friendly language switching with visual feedback
 */

import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { clsx } from 'clsx';

const languages = [
    { code: 'en', label: 'EN', fullName: 'English' },
    { code: 'hi', label: 'हि', fullName: 'हिंदी' },
];

export default function LanguageSelector() {
    const { i18n } = useTranslation();
    const currentLang = i18n.language;

    const handleLanguageChange = (langCode: string) => {
        i18n.changeLanguage(langCode);
    };

    return (
        <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-kiosk-muted" />
            <div className="flex gap-1">
                {languages.map((lang) => (
                    <button
                        key={lang.code}
                        onClick={() => handleLanguageChange(lang.code)}
                        className={clsx(
                            'lang-btn',
                            currentLang === lang.code && 'lang-btn-active'
                        )}
                        aria-label={`Switch to ${lang.fullName}`}
                        aria-pressed={currentLang === lang.code}
                    >
                        {lang.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
