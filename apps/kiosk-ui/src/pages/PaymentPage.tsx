/**
 * Payment Page - Process Bill Payment
 * Touch-optimized payment flow with confirmation
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    CreditCard, Smartphone, Building, Wallet,
    CheckCircle, AlertCircle, ArrowLeft, RefreshCw, Printer
} from 'lucide-react';
import api from '../lib/api';

interface PaymentMethod {
    id: string;
    name: string;
    icon: typeof CreditCard;
    description: string;
}

const paymentMethods: PaymentMethod[] = [
    { id: 'UPI', name: 'UPI', icon: Smartphone, description: 'Pay via any UPI app' },
    { id: 'CARD', name: 'Debit/Credit Card', icon: CreditCard, description: 'Visa, Mastercard, RuPay' },
    { id: 'NETBANKING', name: 'Net Banking', icon: Building, description: 'All major banks' },
    { id: 'WALLET', name: 'Wallet', icon: Wallet, description: 'Paytm, PhonePe, etc.' },
];

type PaymentStep = 'confirm' | 'processing' | 'success' | 'failed';

interface BillInfo {
    id: string;
    billNumber: string;
    utilityType: string;
    amountDue: number;
    amountPaid: number;
}

interface Receipt {
    receiptNumber: string;
    transactionId: string;
    billNumber: string;
    amountPaid: number;
    paymentMethod: string;
    paymentDate: string;
}

export default function PaymentPage() {
    const { billId } = useParams<{ billId: string }>();
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [bill, setBill] = useState<BillInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [step, setStep] = useState<PaymentStep>('confirm');
    const [selectedMethod, setSelectedMethod] = useState<string>('UPI');
    const [receipt, setReceipt] = useState<Receipt | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchBill = async () => {
            if (!billId) return;
            try {
                const response = await api.get(`/billing/bills/${billId}`);
                setBill(response.data.bill);
            } catch (err) {
                setError('Failed to load bill');
            } finally {
                setLoading(false);
            }
        };
        fetchBill();
    }, [billId]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 2,
        }).format(amount);
    };

    const handlePayment = async () => {
        if (!bill) return;

        const paymentAmount = bill.amountDue - bill.amountPaid;

        setStep('processing');
        setError(null);

        try {
            // Simulate payment delay for realistic UX
            await new Promise(resolve => setTimeout(resolve, 2000));

            const response = await api.post('/billing/payments', {
                billId: bill.id,
                amount: paymentAmount,
                paymentMethod: selectedMethod,
            });

            if (response.data.success) {
                setReceipt(response.data.receipt);
                setStep('success');
            } else {
                throw new Error('Payment failed');
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Payment failed. Please try again.');
            setStep('failed');
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <RefreshCw className="w-12 h-12 text-primary-400 animate-spin" />
                <p className="mt-4 text-kiosk-lg text-kiosk-muted">{t('common.loading')}</p>
            </div>
        );
    }

    if (!bill) {
        return (
            <div className="max-w-2xl mx-auto">
                <div className="card-kiosk text-center">
                    <AlertCircle className="w-16 h-16 text-error mx-auto mb-4" />
                    <p className="text-kiosk-muted mb-6">{error || 'Bill not found'}</p>
                    <button onClick={() => navigate(-1)} className="btn-primary">
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    const paymentAmount = bill.amountDue - bill.amountPaid;

    // Success Screen
    if (step === 'success' && receipt) {
        return (
            <div className="max-w-2xl mx-auto animate-slide-up">
                <div className="card-kiosk text-center">
                    <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-14 h-14 text-green-400" />
                    </div>

                    <h2 className="text-kiosk-2xl font-bold text-green-400 mb-2">
                        {t('billing.paymentSuccess')}
                    </h2>
                    <p className="text-kiosk-muted mb-8">
                        Your payment has been processed successfully
                    </p>

                    {/* Receipt */}
                    <div className="bg-kiosk-bg rounded-kiosk-lg p-6 text-left mb-8">
                        <div className="flex justify-between mb-4">
                            <span className="text-kiosk-muted">Receipt No.</span>
                            <span className="font-mono font-bold">{receipt.receiptNumber}</span>
                        </div>
                        <div className="flex justify-between mb-4">
                            <span className="text-kiosk-muted">Transaction ID</span>
                            <span className="font-mono text-kiosk-sm">{receipt.transactionId}</span>
                        </div>
                        <div className="flex justify-between mb-4">
                            <span className="text-kiosk-muted">Bill Number</span>
                            <span>{receipt.billNumber}</span>
                        </div>
                        <div className="flex justify-between mb-4">
                            <span className="text-kiosk-muted">Amount Paid</span>
                            <span className="text-kiosk-lg font-bold text-green-400">
                                {formatCurrency(receipt.amountPaid)}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-kiosk-muted">Payment Method</span>
                            <span>{receipt.paymentMethod}</span>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button className="btn-outline flex-1">
                            <Printer className="w-5 h-5" />
                            {t('billing.printReceipt')}
                        </button>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="btn-primary flex-1"
                        >
                            {t('common.home')}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Processing Screen
    if (step === 'processing') {
        return (
            <div className="max-w-2xl mx-auto">
                <div className="card-kiosk text-center py-16">
                    <RefreshCw className="w-16 h-16 text-primary-400 animate-spin mx-auto mb-6" />
                    <h2 className="text-kiosk-xl font-bold mb-2">Processing Payment</h2>
                    <p className="text-kiosk-muted">Please wait, do not close this screen...</p>
                </div>
            </div>
        );
    }

    // Failed Screen
    if (step === 'failed') {
        return (
            <div className="max-w-2xl mx-auto animate-slide-up">
                <div className="card-kiosk text-center">
                    <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="w-14 h-14 text-red-400" />
                    </div>

                    <h2 className="text-kiosk-2xl font-bold text-red-400 mb-2">
                        Payment Failed
                    </h2>
                    <p className="text-kiosk-muted mb-8">
                        {error || 'Something went wrong. Please try again.'}
                    </p>

                    <div className="flex gap-4">
                        <button
                            onClick={() => setStep('confirm')}
                            className="btn-primary flex-1"
                        >
                            Try Again
                        </button>
                        <button
                            onClick={() => navigate(-1)}
                            className="btn-outline flex-1"
                        >
                            {t('common.cancel')}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Confirmation Screen
    return (
        <div className="max-w-2xl mx-auto animate-slide-up">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => navigate(-1)}
                    className="btn-outline !min-h-12 !min-w-12 !p-3"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <h2 className="text-kiosk-xl font-bold">{t('billing.payNow')}</h2>
            </div>

            {/* Amount Card */}
            <div className="card-kiosk mb-6 text-center">
                <p className="text-kiosk-muted mb-2">Payment Amount</p>
                <p className="text-kiosk-3xl font-bold text-primary-400">
                    {formatCurrency(paymentAmount)}
                </p>
                <p className="text-kiosk-sm text-kiosk-muted mt-2">
                    Bill: {bill.billNumber}
                </p>
            </div>

            {/* Payment Methods */}
            <div className="card-kiosk mb-6">
                <h3 className="text-kiosk-lg font-semibold mb-4">Select Payment Method</h3>
                <div className="space-y-3">
                    {paymentMethods.map((method) => (
                        <button
                            key={method.id}
                            onClick={() => setSelectedMethod(method.id)}
                            className={`w-full flex items-center gap-4 p-4 rounded-kiosk-lg border-2 transition-colors ${selectedMethod === method.id
                                    ? 'border-primary-500 bg-primary-500/10'
                                    : 'border-kiosk-border hover:border-primary-500/50'
                                }`}
                        >
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${selectedMethod === method.id ? 'bg-primary-500/20' : 'bg-kiosk-bg'
                                }`}>
                                <method.icon className={`w-6 h-6 ${selectedMethod === method.id ? 'text-primary-400' : 'text-kiosk-muted'
                                    }`} />
                            </div>
                            <div className="text-left flex-1">
                                <p className="font-semibold">{method.name}</p>
                                <p className="text-kiosk-sm text-kiosk-muted">{method.description}</p>
                            </div>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedMethod === method.id
                                    ? 'border-primary-500 bg-primary-500'
                                    : 'border-kiosk-border'
                                }`}>
                                {selectedMethod === method.id && (
                                    <CheckCircle className="w-4 h-4 text-white" />
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Pay Button */}
            <button
                onClick={handlePayment}
                className="btn-primary w-full text-kiosk-lg"
            >
                <CreditCard className="w-6 h-6" />
                Pay {formatCurrency(paymentAmount)}
            </button>
        </div>
    );
}
