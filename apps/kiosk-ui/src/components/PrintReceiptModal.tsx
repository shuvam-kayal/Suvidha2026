/**
 * Print Receipt Modal - Simulated Hardware for Kiosk
 * Shows printing animation and downloads PDF receipt
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { jsPDF } from 'jspdf';
import {
    Printer,
    Check,
    Download,
    Loader2
} from 'lucide-react';

interface ReceiptData {
    transactionId: string;
    amount: number;
    serviceType: string;
    consumerNumber: string;
    consumerName: string;
    billNumber: string;
    paymentDate: string;
    paymentMethod: string;
}

interface PrintReceiptModalProps {
    isOpen: boolean;
    onClose: () => void;
    receiptData: ReceiptData;
}

type PrintStatus = 'printing' | 'complete' | 'downloading';

// Printer sound effect (simple beep simulation)
const playPrinterSound = () => {
    try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

        // Create oscillator for printer-like sounds
        const playBeep = (freq: number, duration: number, delay: number) => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = freq;
            oscillator.type = 'square';

            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime + delay);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + delay + duration);

            oscillator.start(audioContext.currentTime + delay);
            oscillator.stop(audioContext.currentTime + delay + duration);
        };

        // Simulate printer sounds
        for (let i = 0; i < 5; i++) {
            playBeep(800 + (i * 50), 0.1, i * 0.15);
        }

        // Final confirmation beep
        setTimeout(() => playBeep(1200, 0.3, 0), 1000);
    } catch (error) {
        console.log('Audio not available');
    }
};

const generateReceiptPDF = (data: ReceiptData): jsPDF => {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [80, 150], // Receipt paper size
    });

    const pageWidth = 80;
    let yPos = 10;

    // Header
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('SUVIDHA 2026', pageWidth / 2, yPos, { align: 'center' });
    yPos += 6;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Smart Urban Virtual Interactive Digital', pageWidth / 2, yPos, { align: 'center' });
    yPos += 4;
    doc.text('Helpdesk Assistant', pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;

    // Divider
    doc.setLineWidth(0.5);
    doc.line(5, yPos, pageWidth - 5, yPos);
    yPos += 8;

    // Transaction Details
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('PAYMENT RECEIPT', pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');

    const addRow = (label: string, value: string) => {
        doc.text(label, 5, yPos);
        doc.text(value, pageWidth - 5, yPos, { align: 'right' });
        yPos += 5;
    };

    addRow('Transaction ID:', data.transactionId);
    addRow('Date:', data.paymentDate);
    addRow('Service:', data.serviceType);
    addRow('Consumer No:', data.consumerNumber);
    addRow('Consumer Name:', data.consumerName);
    addRow('Bill No:', data.billNumber);
    addRow('Payment Mode:', data.paymentMethod);

    yPos += 3;

    // Amount (highlighted)
    doc.setLineWidth(0.3);
    doc.line(5, yPos, pageWidth - 5, yPos);
    yPos += 6;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Amount Paid:', 5, yPos);
    doc.text(`₹${data.amount.toLocaleString('en-IN')}`, pageWidth - 5, yPos, { align: 'right' });
    yPos += 6;

    doc.setLineWidth(0.3);
    doc.line(5, yPos, pageWidth - 5, yPos);
    yPos += 10;

    // Footer
    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    doc.text('Thank you for using SUVIDHA Kiosk', pageWidth / 2, yPos, { align: 'center' });
    yPos += 4;
    doc.text('This is a computer-generated receipt', pageWidth / 2, yPos, { align: 'center' });
    yPos += 4;
    doc.text('No signature required', pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;

    // QR Code placeholder
    doc.setFontSize(6);
    doc.text('[QR Code for verification]', pageWidth / 2, yPos, { align: 'center' });
    doc.rect(pageWidth / 2 - 10, yPos + 2, 20, 20);
    doc.text('SCAN TO VERIFY', pageWidth / 2, yPos + 25, { align: 'center' });

    return doc;
};

export default function PrintReceiptModal({ isOpen, onClose, receiptData }: PrintReceiptModalProps) {
    const { t } = useTranslation();
    const [status, setStatus] = useState<PrintStatus>('printing');
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        if (isOpen) {
            setStatus('printing');
            setProgress(0);

            // Play printer sound
            playPrinterSound();

            // Simulate printing progress
            const interval = setInterval(() => {
                setProgress((prev) => {
                    if (prev >= 100) {
                        clearInterval(interval);
                        return 100;
                    }
                    return prev + 10;
                });
            }, 200);

            // Complete printing after 2 seconds
            const timer = setTimeout(() => {
                setStatus('complete');
                clearInterval(interval);
            }, 2500);

            return () => {
                clearTimeout(timer);
                clearInterval(interval);
            };
        }
    }, [isOpen]);

    const handleDownload = () => {
        setStatus('downloading');

        try {
            const doc = generateReceiptPDF(receiptData);
            doc.save(`SUVIDHA_Receipt_${receiptData.transactionId}.pdf`);

            setTimeout(() => {
                onClose();
            }, 500);
        } catch (error) {
            console.error('Error generating PDF:', error);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-md bg-kiosk-card border border-kiosk-border rounded-kiosk-xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-kiosk-border bg-secondary-600/20">
                    <div className="flex items-center justify-center gap-4">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${status === 'complete'
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-secondary-500/20 text-secondary-400'
                            }`}>
                            {status === 'printing' && (
                                <Printer className="w-8 h-8 animate-pulse" />
                            )}
                            {status === 'complete' && (
                                <Check className="w-8 h-8" />
                            )}
                            {status === 'downloading' && (
                                <Download className="w-8 h-8 animate-bounce" />
                            )}
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 text-center">
                    {status === 'printing' && (
                        <>
                            <h3 className="text-xl font-bold mb-2">
                                {t('print.printing', 'Printing Receipt...')}
                            </h3>
                            <p className="text-kiosk-muted mb-6">
                                {t('print.pleaseWait', 'Please wait while your receipt is being printed')}
                            </p>

                            {/* Progress bar */}
                            <div className="w-full bg-kiosk-bg rounded-full h-3 overflow-hidden">
                                <div
                                    className="h-full bg-secondary-500 transition-all duration-200 rounded-full"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <p className="text-sm text-kiosk-muted mt-2">{progress}%</p>

                            {/* Printing animation */}
                            <div className="mt-6 flex justify-center">
                                <div className="relative">
                                    <div className="w-32 h-20 border-2 border-kiosk-border rounded-lg flex items-end justify-center overflow-hidden">
                                        <div
                                            className="w-24 bg-white transition-all duration-300"
                                            style={{ height: `${progress * 0.6}%` }}
                                        />
                                    </div>
                                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-28 h-4 bg-kiosk-bg border border-kiosk-border rounded" />
                                </div>
                            </div>
                        </>
                    )}

                    {(status === 'complete' || status === 'downloading') && (
                        <>
                            <h3 className="text-xl font-bold text-green-400 mb-2">
                                {t('print.complete', 'Receipt Ready!')}
                            </h3>
                            <p className="text-kiosk-muted mb-6">
                                {t('print.downloadPrompt', 'Click below to download your receipt')}
                            </p>

                            {/* Receipt preview */}
                            <div className="bg-white text-gray-800 p-4 rounded-lg mb-6 text-sm">
                                <p className="font-bold">SUVIDHA 2026</p>
                                <p className="text-xs text-gray-500 mb-2">Payment Receipt</p>
                                <div className="border-t border-gray-200 pt-2 space-y-1">
                                    <div className="flex justify-between">
                                        <span>Transaction:</span>
                                        <span className="font-mono">{receiptData.transactionId}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Service:</span>
                                        <span>{receiptData.serviceType}</span>
                                    </div>
                                    <div className="flex justify-between font-bold text-lg border-t border-gray-200 pt-2 mt-2">
                                        <span>Amount:</span>
                                        <span>₹{receiptData.amount.toLocaleString('en-IN')}</span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleDownload}
                                disabled={status === 'downloading'}
                                className="btn-primary w-full !min-h-14"
                            >
                                {status === 'downloading' ? (
                                    <>
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                        {t('print.downloading', 'Downloading...')}
                                    </>
                                ) : (
                                    <>
                                        <Download className="w-6 h-6" />
                                        {t('print.downloadReceipt', 'Download Receipt (PDF)')}
                                    </>
                                )}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
