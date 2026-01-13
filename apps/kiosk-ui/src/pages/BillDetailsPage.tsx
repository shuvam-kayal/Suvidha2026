/**
 * Bill Details Page - View and Pay Bill
 * Shows full bill breakdown with payment option
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Zap, Flame, Droplets, Building2,
    AlertCircle, CheckCircle, CreditCard,
    Receipt, ArrowLeft, RefreshCw
} from 'lucide-react';
import api from '../lib/api';

interface BillDetails {
    id: string;
    utilityType: 'ELECTRICITY' | 'GAS' | 'WATER' | 'MUNICIPAL';
    billNumber: string;
    billDate: string;
    dueDate: string;
    amountDue: number;
    amountPaid: number;
    status: string;
    details: {
        unitsConsumed?: number;
        ratePerUnit?: number;
        fixedCharges: number;
        taxes: number;
    };
}

const utilityIcons: Record<string, typeof Zap> = {
    ELECTRICITY: Zap,
    GAS: Flame,
    WATER: Droplets,
    MUNICIPAL: Building2,
};

const utilityColors: Record<string, string> = {
    ELECTRICITY: 'text-yellow-400',
    GAS: 'text-orange-400',
    WATER: 'text-blue-400',
    MUNICIPAL: 'text-emerald-400',
};

export default function BillDetailsPage() {
    const { billId } = useParams<{ billId: string }>();
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [bill, setBill] = useState<BillDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchBill = async () => {
            if (!billId) return;

            setLoading(true);
            try {
                const response = await api.get(`/billing/bills/${billId}`);
                setBill(response.data.bill);
            } catch (err: any) {
                setError(err.response?.data?.error || 'Failed to load bill');
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

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <RefreshCw className="w-12 h-12 text-primary-400 animate-spin" />
                <p className="mt-4 text-kiosk-lg text-kiosk-muted">{t('common.loading')}</p>
            </div>
        );
    }

    if (error || !bill) {
        return (
            <div className="max-w-2xl mx-auto">
                <div className="card-kiosk text-center">
                    <AlertCircle className="w-16 h-16 text-error mx-auto mb-4" />
                    <h3 className="text-kiosk-xl font-bold mb-2">Bill Not Found</h3>
                    <p className="text-kiosk-muted mb-6">{error || 'Unable to load bill details'}</p>
                    <button onClick={() => navigate(-1)} className="btn-primary">
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    const UtilityIcon = utilityIcons[bill.utilityType] || Zap;
    const utilityColor = utilityColors[bill.utilityType] || 'text-yellow-400';
    const remainingAmount = bill.amountDue - bill.amountPaid;
    const isPaid = bill.status === 'PAID';

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
                <div className="flex items-center gap-3">
                    <UtilityIcon className={`w-10 h-10 ${utilityColor}`} />
                    <div>
                        <h2 className="text-kiosk-xl font-bold">{t('billing.billDetails')}</h2>
                        <p className="text-kiosk-sm text-kiosk-muted">{bill.billNumber}</p>
                    </div>
                </div>
            </div>

            {/* Bill Card */}
            <div className="card-kiosk mb-6">
                {/* Status Badge */}
                <div className="flex justify-between items-center mb-6">
                    <span className="text-kiosk-muted">Status</span>
                    <span className={`px-4 py-2 rounded-full text-kiosk-sm font-medium ${isPaid
                            ? 'bg-green-500/20 text-green-400'
                            : bill.status === 'OVERDUE'
                                ? 'bg-red-500/20 text-red-400'
                                : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                        {isPaid ? (
                            <span className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4" />
                                PAID
                            </span>
                        ) : (
                            bill.status.replace('_', ' ')
                        )}
                    </span>
                </div>

                {/* Amount Section */}
                <div className="text-center py-6 border-y border-kiosk-border">
                    <p className="text-kiosk-muted mb-2">{t('billing.amountDue')}</p>
                    <p className="text-kiosk-3xl font-bold text-primary-400">
                        {formatCurrency(remainingAmount)}
                    </p>
                    {bill.amountPaid > 0 && (
                        <p className="text-kiosk-sm text-secondary-400 mt-2">
                            Paid: {formatCurrency(bill.amountPaid)}
                        </p>
                    )}
                </div>

                {/* Bill Details */}
                <div className="mt-6 space-y-4">
                    <div className="flex justify-between">
                        <span className="text-kiosk-muted">Bill Date</span>
                        <span className="font-medium">{formatDate(bill.billDate)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-kiosk-muted">{t('billing.dueDate')}</span>
                        <span className={`font-medium ${new Date(bill.dueDate) < new Date() && !isPaid ? 'text-red-400' : ''
                            }`}>
                            {formatDate(bill.dueDate)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Breakdown */}
            <div className="card-kiosk mb-6">
                <h3 className="text-kiosk-lg font-semibold mb-4">Bill Breakdown</h3>
                <div className="space-y-3">
                    {bill.details.unitsConsumed !== undefined && (
                        <>
                            <div className="flex justify-between">
                                <span className="text-kiosk-muted">Units Consumed</span>
                                <span>{bill.details.unitsConsumed}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-kiosk-muted">Rate per Unit</span>
                                <span>{formatCurrency(bill.details.ratePerUnit || 0)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-kiosk-muted">Usage Charges</span>
                                <span>
                                    {formatCurrency((bill.details.unitsConsumed || 0) * (bill.details.ratePerUnit || 0))}
                                </span>
                            </div>
                        </>
                    )}
                    <div className="flex justify-between">
                        <span className="text-kiosk-muted">Fixed Charges</span>
                        <span>{formatCurrency(bill.details.fixedCharges)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-kiosk-muted">Taxes</span>
                        <span>{formatCurrency(bill.details.taxes)}</span>
                    </div>
                    <div className="border-t border-kiosk-border pt-3 mt-3">
                        <div className="flex justify-between text-kiosk-lg font-bold">
                            <span>Total</span>
                            <span className="text-primary-400">{formatCurrency(bill.amountDue)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
                {!isPaid && (
                    <button
                        onClick={() => navigate(`/pay/${billId}`)}
                        className="btn-primary flex-1"
                    >
                        <CreditCard className="w-6 h-6" />
                        {t('billing.payNow')}
                    </button>
                )}
                <button
                    onClick={() => navigate(`/services/${bill.utilityType.toLowerCase()}`)}
                    className="btn-outline flex-1"
                >
                    <Receipt className="w-5 h-5" />
                    View All Bills
                </button>
            </div>
        </div>
    );
}
