/**
 * Consent Modal - DPDP Act Compliance
 * Blocks login until user consents to data processing
 */

import { useTranslation } from 'react-i18next';
import { Shield, FileText, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useConsentStore } from '../stores/consentStore';
import { useState } from 'react';

interface ConsentModalProps {
    isOpen: boolean;
    onConsent: () => void;
}

export default function ConsentModal({ isOpen, onConsent }: ConsentModalProps) {
    const { t } = useTranslation();
    const { giveConsent } = useConsentStore();
    const [showDeclineWarning, setShowDeclineWarning] = useState(false);

    if (!isOpen) return null;

    const handleAgree = () => {
        giveConsent();
        onConsent();
    };

    const handleDecline = () => {
        setShowDeclineWarning(true);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-2xl bg-kiosk-card border border-kiosk-border rounded-kiosk-lg shadow-2xl animate-slide-up overflow-hidden">
                {/* Header */}
                <div className="bg-primary-600/20 border-b border-primary-500/30 p-6">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-primary-600/30 flex items-center justify-center">
                            <Shield className="w-8 h-8 text-primary-400" />
                        </div>
                        <div>
                            <h2 className="text-kiosk-xl font-bold text-white">
                                {t('consent.title', 'Data Protection Consent')}
                            </h2>
                            <p className="text-kiosk-sm text-kiosk-muted">
                                {t('consent.subtitle', 'DPDP Act 2023 Compliance')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 max-h-[50vh] overflow-y-auto">
                    {showDeclineWarning ? (
                        <div className="text-center py-8">
                            <AlertTriangle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                            <h3 className="text-kiosk-lg font-semibold text-yellow-300 mb-3">
                                {t('consent.declineTitle', 'Consent Required')}
                            </h3>
                            <p className="text-kiosk-muted mb-6">
                                {t('consent.declineMessage', 'You must provide consent to use the authentication services. Without consent, you cannot proceed with login.')}
                            </p>
                            <button
                                onClick={() => setShowDeclineWarning(false)}
                                className="btn-primary"
                            >
                                {t('consent.goBack', 'Go Back')}
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-start gap-3 mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-kiosk">
                                <FileText className="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" />
                                <div className="text-kiosk-sm text-blue-200">
                                    <p className="font-semibold mb-1">
                                        {t('consent.lawReference', 'Digital Personal Data Protection Act, 2023')}
                                    </p>
                                    <p className="text-blue-300/80">
                                        {t('consent.lawDescription', 'As per the DPDP Act requirements, we need your explicit consent before processing your personal data.')}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4 text-kiosk-base text-kiosk-muted">
                                <p>
                                    <strong className="text-white">{t('consent.iConsent', 'I hereby consent to')}:</strong>
                                </p>

                                <ul className="space-y-3 ml-4">
                                    <li className="flex items-start gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-secondary-400 flex-shrink-0 mt-0.5" />
                                        <span>
                                            {t('consent.item1', 'The collection and processing of my mobile number for OTP-based authentication.')}
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-secondary-400 flex-shrink-0 mt-0.5" />
                                        <span>
                                            {t('consent.item2', 'The processing of my UIDAI/Aadhaar biometric data (if applicable) solely for identity verification purposes.')}
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-secondary-400 flex-shrink-0 mt-0.5" />
                                        <span>
                                            {t('consent.item3', 'The storage of my service usage data for providing utility services (Electricity, Water, Gas).')}
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-secondary-400 flex-shrink-0 mt-0.5" />
                                        <span>
                                            {t('consent.item4', 'My data being retained for the duration necessary to provide the requested services and as required by law.')}
                                        </span>
                                    </li>
                                </ul>

                                <p className="text-kiosk-sm text-kiosk-muted/80 mt-4 pt-4 border-t border-kiosk-border">
                                    {t('consent.rights', 'You have the right to withdraw this consent at any time, access your data, request corrections, and request deletion of your data in accordance with the DPDP Act 2023.')}
                                </p>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                {!showDeclineWarning && (
                    <div className="p-6 bg-kiosk-bg border-t border-kiosk-border flex gap-4">
                        <button
                            onClick={handleDecline}
                            className="btn-outline flex-1 !min-h-14 text-red-400 border-red-400/50 hover:bg-red-400/10"
                        >
                            {t('consent.decline', 'I Decline')}
                        </button>
                        <button
                            onClick={handleAgree}
                            className="btn-primary flex-1 !min-h-14"
                        >
                            <Shield className="w-5 h-5" />
                            {t('consent.agree', 'I Agree')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
