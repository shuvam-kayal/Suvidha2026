/**
 * Biometric Authentication Simulation
 * Touch-friendly interface for fingerprint/face simulation
 */

import { useState, useEffect, useCallback } from 'react';
import { Fingerprint, Scan, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

type BiometricType = 'fingerprint' | 'face';
type BiometricStatus = 'idle' | 'scanning' | 'success' | 'failed';

interface BiometricAuthProps {
    type?: BiometricType;
    onSuccess: () => void;
    onCancel: () => void;
    simulatedDelay?: number;
    successRate?: number; // 0-1, default 0.9
}

export default function BiometricAuth({
    type = 'fingerprint',
    onSuccess,
    onCancel,
    simulatedDelay = 2000,
    successRate = 0.9,
}: BiometricAuthProps) {
    const [status, setStatus] = useState<BiometricStatus>('idle');
    const [progress, setProgress] = useState(0);
    const [attempts, setAttempts] = useState(0);
    const maxAttempts = 3;

    const startScan = useCallback(() => {
        if (status === 'scanning') return;

        setStatus('scanning');
        setProgress(0);

        // Animate progress
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    return 100;
                }
                return prev + 5;
            });
        }, simulatedDelay / 20);

        // Simulate biometric result
        setTimeout(() => {
            clearInterval(interval);
            setProgress(100);

            const isSuccess = Math.random() <= successRate;
            if (isSuccess) {
                setStatus('success');
                setTimeout(onSuccess, 500);
            } else {
                setStatus('failed');
                setAttempts(prev => prev + 1);
            }
        }, simulatedDelay);
    }, [status, simulatedDelay, successRate, onSuccess]);

    const handleRetry = () => {
        if (attempts >= maxAttempts) {
            onCancel();
            return;
        }
        setStatus('idle');
        setProgress(0);
    };

    const Icon = type === 'fingerprint' ? Fingerprint : Scan;

    return (
        <div className="flex flex-col items-center justify-center p-8">
            {/* Biometric Icon with Animation */}
            <div
                className={`
          relative w-48 h-48 rounded-full flex items-center justify-center
          transition-all duration-300
          ${status === 'idle' ? 'bg-primary-500/20' : ''}
          ${status === 'scanning' ? 'bg-blue-500/20 animate-pulse' : ''}
          ${status === 'success' ? 'bg-green-500/20' : ''}
          ${status === 'failed' ? 'bg-red-500/20' : ''}
        `}
                role="status"
                aria-live="polite"
            >
                {/* Progress Ring */}
                {status === 'scanning' && (
                    <svg
                        className="absolute inset-0 w-full h-full -rotate-90"
                        aria-hidden="true"
                    >
                        <circle
                            cx="96"
                            cy="96"
                            r="88"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="4"
                            className="text-primary-500/30"
                        />
                        <circle
                            cx="96"
                            cy="96"
                            r="88"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="4"
                            strokeDasharray={`${2 * Math.PI * 88}`}
                            strokeDashoffset={`${2 * Math.PI * 88 * (1 - progress / 100)}`}
                            className="text-primary-500 transition-all duration-100"
                        />
                    </svg>
                )}

                {status === 'success' ? (
                    <CheckCircle className="w-24 h-24 text-green-400" />
                ) : status === 'failed' ? (
                    <AlertCircle className="w-24 h-24 text-red-400" />
                ) : (
                    <Icon className={`w-24 h-24 ${status === 'scanning' ? 'text-blue-400' : 'text-primary-400'}`} />
                )}
            </div>

            {/* Status Text */}
            <div className="mt-6 text-center">
                {status === 'idle' && (
                    <>
                        <h3 className="text-kiosk-xl font-bold mb-2">
                            {type === 'fingerprint' ? 'Fingerprint Verification' : 'Face Verification'}
                        </h3>
                        <p className="text-kiosk-muted">
                            {type === 'fingerprint'
                                ? 'Place your finger on the scanner'
                                : 'Look at the camera'}
                        </p>
                    </>
                )}

                {status === 'scanning' && (
                    <>
                        <h3 className="text-kiosk-xl font-bold text-blue-400 mb-2">
                            Scanning...
                        </h3>
                        <p className="text-kiosk-muted">
                            Please hold still
                        </p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <h3 className="text-kiosk-xl font-bold text-green-400 mb-2">
                            Verified!
                        </h3>
                        <p className="text-kiosk-muted">
                            Authentication successful
                        </p>
                    </>
                )}

                {status === 'failed' && (
                    <>
                        <h3 className="text-kiosk-xl font-bold text-red-400 mb-2">
                            Verification Failed
                        </h3>
                        <p className="text-kiosk-muted">
                            {attempts >= maxAttempts
                                ? 'Maximum attempts reached'
                                : `Please try again (${maxAttempts - attempts} attempts remaining)`}
                        </p>
                    </>
                )}
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex gap-4">
                {status === 'idle' && (
                    <>
                        <button
                            onClick={startScan}
                            className="btn-primary"
                            aria-label={`Start ${type} scan`}
                        >
                            <Icon className="w-5 h-5" aria-hidden="true" />
                            Start Scan
                        </button>
                        <button
                            onClick={onCancel}
                            className="btn-outline"
                        >
                            Cancel
                        </button>
                    </>
                )}

                {status === 'failed' && attempts < maxAttempts && (
                    <button
                        onClick={handleRetry}
                        className="btn-primary"
                    >
                        <RefreshCw className="w-5 h-5" aria-hidden="true" />
                        Try Again
                    </button>
                )}

                {status === 'failed' && attempts >= maxAttempts && (
                    <button
                        onClick={onCancel}
                        className="btn-outline"
                    >
                        Use OTP Instead
                    </button>
                )}
            </div>
        </div>
    );
}
