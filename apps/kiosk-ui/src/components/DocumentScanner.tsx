/**
 * Document Scanner - Simulated Hardware for Kiosk
 * Camera-based document scanning with frame capture
 */

import { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import Webcam from 'react-webcam';
import {
    Camera,
    X,
    RotateCcw,
    Check,
    AlertCircle,
    Loader2,
    ScanLine
} from 'lucide-react';

interface DocumentScannerProps {
    isOpen: boolean;
    onClose: () => void;
    onCapture: (imageData: string) => void;
}

export default function DocumentScanner({ isOpen, onClose, onCapture }: DocumentScannerProps) {
    const { t } = useTranslation();
    const webcamRef = useRef<Webcam>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const handleCapture = useCallback(() => {
        if (webcamRef.current) {
            setIsScanning(true);

            // Simulate scanning effect
            setTimeout(() => {
                const imageSrc = webcamRef.current?.getScreenshot();
                if (imageSrc) {
                    setCapturedImage(imageSrc);
                }
                setIsScanning(false);
            }, 1500);
        }
    }, []);

    const handleRetake = () => {
        setCapturedImage(null);
    };

    const handleConfirm = () => {
        if (capturedImage) {
            onCapture(capturedImage);
            setCapturedImage(null);
            onClose();
        }
    };

    const handleUserMedia = () => {
        setIsLoading(false);
        setHasError(false);
    };

    const handleUserMediaError = () => {
        setIsLoading(false);
        setHasError(true);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-2xl bg-kiosk-card border border-kiosk-border rounded-kiosk-xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-kiosk-border bg-secondary-600/20">
                    <div className="flex items-center gap-3">
                        <ScanLine className="w-6 h-6 text-secondary-400" />
                        <div>
                            <h3 className="font-semibold text-white">
                                {t('scanner.title', 'Document Scanner')}
                            </h3>
                            <p className="text-xs text-kiosk-muted">
                                {t('scanner.subtitle', 'Position document in frame')}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-kiosk-border/50 rounded-full transition-colors"
                        aria-label={t('common.close', 'Close')}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Camera / Preview Area */}
                <div className="relative aspect-[4/3] bg-black">
                    {hasError ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                            <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
                            <h4 className="text-lg font-semibold text-white mb-2">
                                {t('scanner.cameraError', 'Camera Not Available')}
                            </h4>
                            <p className="text-kiosk-muted mb-4">
                                {t('scanner.cameraErrorDesc', 'Please allow camera access or use the file upload option.')}
                            </p>
                            <button
                                onClick={onClose}
                                className="btn-outline !min-h-10"
                            >
                                {t('common.close', 'Close')}
                            </button>
                        </div>
                    ) : capturedImage ? (
                        // Show captured image
                        <img
                            src={capturedImage}
                            alt="Captured document"
                            className="w-full h-full object-contain"
                        />
                    ) : (
                        // Show webcam feed
                        <>
                            {isLoading && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Loader2 className="w-12 h-12 animate-spin text-secondary-400" />
                                </div>
                            )}
                            <Webcam
                                ref={webcamRef}
                                audio={false}
                                screenshotFormat="image/jpeg"
                                screenshotQuality={0.9}
                                className="w-full h-full object-cover"
                                onUserMedia={handleUserMedia}
                                onUserMediaError={handleUserMediaError}
                                videoConstraints={{
                                    facingMode: 'environment',
                                    width: 1280,
                                    height: 720,
                                }}
                            />

                            {/* Scanning overlay */}
                            {isScanning && (
                                <div className="absolute inset-0 bg-secondary-500/20 flex items-center justify-center">
                                    <div className="bg-black/80 px-6 py-4 rounded-kiosk flex items-center gap-3">
                                        <Loader2 className="w-6 h-6 animate-spin text-secondary-400" />
                                        <span className="text-white font-medium">
                                            {t('scanner.scanning', 'Scanning document...')}
                                        </span>
                                    </div>
                                    {/* Scanning line animation */}
                                    <div className="absolute inset-x-4 top-0 h-1 bg-secondary-400 animate-scan-line" />
                                </div>
                            )}

                            {/* Frame guide */}
                            {!isScanning && !isLoading && (
                                <div className="absolute inset-8 border-2 border-dashed border-secondary-400/50 rounded-lg pointer-events-none" />
                            )}
                        </>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="p-4 bg-kiosk-bg border-t border-kiosk-border">
                    {capturedImage ? (
                        <div className="flex gap-4">
                            <button
                                onClick={handleRetake}
                                className="btn-outline flex-1 !min-h-12"
                            >
                                <RotateCcw className="w-5 h-5" />
                                {t('scanner.retake', 'Retake')}
                            </button>
                            <button
                                onClick={handleConfirm}
                                className="btn-primary flex-1 !min-h-12"
                            >
                                <Check className="w-5 h-5" />
                                {t('scanner.useImage', 'Use This Image')}
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={handleCapture}
                            disabled={isScanning || isLoading || hasError}
                            className="btn-secondary w-full !min-h-14"
                        >
                            {isScanning ? (
                                <>
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                    {t('scanner.scanning', 'Scanning...')}
                                </>
                            ) : (
                                <>
                                    <Camera className="w-6 h-6" />
                                    {t('scanner.scanNow', 'Scan Now')}
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
