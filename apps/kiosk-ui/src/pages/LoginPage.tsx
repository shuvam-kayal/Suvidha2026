/**
 * Login Page - OTP-Based Authentication
 * Touch-optimized with large input fields and visual feedback
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Phone, KeyRound, ArrowRight, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useConsentStore } from '../stores/consentStore';
import { requestOtp, verifyOtp } from '../lib/api';
import ConsentModal from '../components/ConsentModal';

type LoginStep = 'phone' | 'otp';

export default function LoginPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const { isAuthenticated, setTokens, setUser, isLoading, error, setLoading, setError, clearError } = useAuthStore();
    const { hasConsented, checkConsentValidity } = useConsentStore();

    const [step, setStep] = useState<LoginStep>('phone');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [otpExpiresIn, setOtpExpiresIn] = useState(0);
    const [devOtp, setDevOtp] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [showConsentModal, setShowConsentModal] = useState(false);

    // Check if consent is needed
    useEffect(() => {
        if (!hasConsented || !checkConsentValidity()) {
            setShowConsentModal(true);
        }
    }, [hasConsented, checkConsentValidity]);

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard');
        }
    }, [isAuthenticated, navigate]);

    // OTP expiry countdown
    useEffect(() => {
        if (otpExpiresIn > 0) {
            const timer = setInterval(() => {
                setOtpExpiresIn((prev) => Math.max(0, prev - 1));
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [otpExpiresIn]);

    const handleSendOtp = async () => {
        if (phoneNumber.length !== 10) return;

        clearError();
        setLoading(true);

        try {
            const response = await requestOtp(phoneNumber);
            setOtpExpiresIn(response.expiresIn);
            setDevOtp(response._devOtp || null);
            setSuccessMessage(response.message);
            setStep('otp');

            // Clear success message after 3 seconds
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err: any) {
            setError(err.response?.data?.message || err.response?.data?.error || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (otp.length !== 6) return;

        clearError();
        setLoading(true);

        try {
            const response = await verifyOtp(phoneNumber, otp);

            // Update auth store
            setTokens(response.accessToken, response.refreshToken);
            setUser(response.user);

            // Navigate to dashboard
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.message || err.response?.data?.error || 'Invalid OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        setOtp('');
        await handleSendOtp();
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <>
            {/* DPDP Consent Modal */}
            <ConsentModal
                isOpen={showConsentModal}
                onConsent={() => setShowConsentModal(false)}
            />

            <div className="max-w-lg mx-auto animate-slide-up">
                <div className="card-kiosk">
                    <h2 className="text-kiosk-xl font-bold text-center mb-8">
                        {t('auth.login')}
                    </h2>

                    {/* Success Message */}
                    {successMessage && (
                        <div className="mb-6 p-4 bg-secondary-600/20 border border-secondary-500 rounded-kiosk flex items-center gap-3">
                            <CheckCircle className="w-6 h-6 text-secondary-400 flex-shrink-0" />
                            <p className="text-secondary-300">{successMessage}</p>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 bg-error/20 border border-error rounded-kiosk flex items-center gap-3">
                            <AlertCircle className="w-6 h-6 text-error flex-shrink-0" />
                            <p className="text-red-300">{error}</p>
                        </div>
                    )}

                    {/* Dev OTP Display */}
                    {devOtp && step === 'otp' && (
                        <div className="mb-6 p-4 bg-accent-500/20 border border-accent-500 rounded-kiosk text-center">
                            <p className="text-kiosk-sm text-accent-300">Development Mode - OTP:</p>
                            <p className="text-kiosk-xl font-mono font-bold text-accent-400 tracking-[0.3em]">{devOtp}</p>
                        </div>
                    )}

                    {step === 'phone' ? (
                        // Phone Number Entry
                        <div className="space-y-6">
                            <div>
                                <label className="block text-kiosk-sm text-kiosk-muted mb-2">
                                    {t('auth.phoneNumber')}
                                </label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-kiosk-muted" />
                                    <input
                                        type="tel"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                        placeholder="Enter 10-digit number"
                                        className="input-kiosk pl-14"
                                        autoFocus
                                        disabled={isLoading}
                                    />
                                </div>
                                <p className="mt-2 text-kiosk-sm text-kiosk-muted">
                                    Indian mobile number (6-9 starting digit)
                                </p>
                            </div>

                            <button
                                onClick={handleSendOtp}
                                disabled={phoneNumber.length !== 10 || isLoading}
                                className="btn-primary w-full"
                            >
                                {isLoading ? t('common.loading') : t('auth.sendOtp')}
                                <ArrowRight className="w-6 h-6" />
                            </button>
                        </div>
                    ) : (
                        // OTP Entry
                        <div className="space-y-6">
                            <p className="text-center text-kiosk-muted">
                                OTP sent to <span className="text-primary-400 font-medium">+91 {phoneNumber}</span>
                            </p>

                            {otpExpiresIn > 0 && (
                                <p className="text-center text-kiosk-sm text-accent-400">
                                    Expires in {formatTime(otpExpiresIn)}
                                </p>
                            )}

                            <div>
                                <label className="block text-kiosk-sm text-kiosk-muted mb-2">
                                    {t('auth.enterOtp')}
                                </label>
                                <div className="relative">
                                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-kiosk-muted" />
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        placeholder="• • • • • •"
                                        className="input-kiosk pl-14 text-center tracking-[0.5em] text-kiosk-xl font-mono"
                                        autoFocus
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleVerifyOtp}
                                disabled={otp.length !== 6 || isLoading}
                                className="btn-primary w-full"
                            >
                                {isLoading ? t('common.loading') : t('auth.verifyOtp')}
                                <ArrowRight className="w-6 h-6" />
                            </button>

                            <button
                                onClick={handleResendOtp}
                                disabled={isLoading || otpExpiresIn > 240}
                                className="btn-outline w-full"
                            >
                                <RefreshCw className="w-5 h-5" />
                                {t('auth.resendOtp')}
                            </button>

                            <button
                                onClick={() => {
                                    setStep('phone');
                                    setOtp('');
                                    clearError();
                                }}
                                className="w-full text-center text-kiosk-muted hover:text-primary-400 transition-colors"
                            >
                                Change phone number
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
