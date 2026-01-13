/**
 * Bills Page - List of Utility Bills
 * Touch-optimized display with filtering by utility type
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Zap, Flame, Droplets, Building2,
    AlertCircle, CheckCircle, Clock,
    ChevronRight, RefreshCw
} from 'lucide-react';
import api from '../lib/api';

// Types
interface BillSummary {
    id: string;
    utilityType: 'ELECTRICITY' | 'GAS' | 'WATER' | 'MUNICIPAL';
    billNumber: string;
    dueDate: string;
    amountDue: number;
    status: 'PENDING' | 'PAID' | 'OVERDUE' | 'PARTIALLY_PAID';
}

// Utility icon mapping
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

const statusColors: Record<string, { bg: string; text: string; icon: typeof CheckCircle }> = {
    PENDING: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', icon: Clock },
    PAID: { bg: 'bg-green-500/20', text: 'text-green-400', icon: CheckCircle },
    OVERDUE: { bg: 'bg-red-500/20', text: 'text-red-400', icon: AlertCircle },
    PARTIALLY_PAID: { bg: 'bg-blue-500/20', text: 'text-blue-400', icon: Clock },
};

export default function BillsPage() {
    const { type } = useParams<{ type: string }>();
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [bills, setBills] = useState<BillSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const utilityType = type?.toUpperCase() || 'ELECTRICITY';
    const UtilityIcon = utilityIcons[utilityType] || Zap;
    const utilityColor = utilityColors[utilityType] || 'text-yellow-400';

    // Fetch bills
    useEffect(() => {
        const fetchBills = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await api.get(`/billing/bills?type=${utilityType}`);
                setBills(response.data.bills || []);
            } catch (err: any) {
                console.error('Failed to fetch bills:', err);
                setError(err.response?.data?.error || 'Failed to load bills');
            } finally {
                setLoading(false);
            }
        };

        fetchBills();
    }, [utilityType]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const handleBillSelect = (billId: string) => {
        navigate(`/bill/${billId}`);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <RefreshCw className="w-12 h-12 text-primary-400 animate-spin" />
                <p className="mt-4 text-kiosk-lg text-kiosk-muted">{t('common.loading')}</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-2xl mx-auto">
                <div className="card-kiosk text-center">
                    <AlertCircle className="w-16 h-16 text-error mx-auto mb-4" />
                    <h3 className="text-kiosk-xl font-bold mb-2">{t('common.error')}</h3>
                    <p className="text-kiosk-muted mb-6">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="btn-primary"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto animate-slide-up">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <UtilityIcon className={`w-12 h-12 ${utilityColor}`} />
                <div>
                    <h2 className="text-kiosk-2xl font-bold">
                        {t(`services.${type?.toLowerCase()}`)} Bills
                    </h2>
                    <p className="text-kiosk-muted">
                        {bills.length} bill{bills.length !== 1 ? 's' : ''} found
                    </p>
                </div>
            </div>

            {/* Bills List */}
            {bills.length === 0 ? (
                <div className="card-kiosk text-center py-12">
                    <CheckCircle className="w-16 h-16 text-secondary-400 mx-auto mb-4" />
                    <h3 className="text-kiosk-xl font-semibold">No Pending Bills</h3>
                    <p className="text-kiosk-muted mt-2">All your bills are paid!</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {bills.map((bill) => {
                        const StatusIcon = statusColors[bill.status]?.icon || Clock;
                        return (
                            <button
                                key={bill.id}
                                onClick={() => handleBillSelect(bill.id)}
                                className="card-kiosk w-full flex items-center justify-between hover:border-primary-500 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-full ${statusColors[bill.status]?.bg || 'bg-gray-500/20'} flex items-center justify-center`}>
                                        <StatusIcon className={`w-6 h-6 ${statusColors[bill.status]?.text || 'text-gray-400'}`} />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-kiosk-base font-semibold">{bill.billNumber}</p>
                                        <p className="text-kiosk-sm text-kiosk-muted">
                                            Due: {formatDate(bill.dueDate)}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <p className="text-kiosk-lg font-bold text-primary-400">
                                            {formatCurrency(bill.amountDue)}
                                        </p>
                                        <span className={`text-kiosk-sm ${statusColors[bill.status]?.text || 'text-gray-400'}`}>
                                            {bill.status.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <ChevronRight className="w-6 h-6 text-kiosk-muted" />
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Back Button */}
            <div className="mt-8 flex justify-center">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="btn-outline"
                >
                    {t('common.back')}
                </button>
            </div>
        </div>
    );
}
