/**
 * Transactions Page - Payment history and analytics
 */

import { useState } from 'react';
import {
    Search, ChevronDown, CreditCard, Download,
    Zap, Flame, Droplets, Building2,
    CheckCircle, XCircle, Clock
} from 'lucide-react';

type UtilityType = 'ELECTRICITY' | 'GAS' | 'WATER' | 'MUNICIPAL';
type PaymentStatus = 'SUCCESS' | 'FAILED' | 'PENDING';

interface Transaction {
    id: string;
    transactionId: string;
    billNumber: string;
    utilityType: UtilityType;
    amount: number;
    paymentMethod: string;
    status: PaymentStatus;
    timestamp: string;
    userPhone: string;
    kioskId: string;
}

// Mock data
const mockTransactions: Transaction[] = [
    {
        id: '1',
        transactionId: 'TXN26011301AB',
        billNumber: 'ELEC-2026-001234',
        utilityType: 'ELECTRICITY',
        amount: 2450,
        paymentMethod: 'UPI',
        status: 'SUCCESS',
        timestamp: '2026-01-13T14:30:00Z',
        userPhone: '+91 98765****1',
        kioskId: 'K-012',
    },
    {
        id: '2',
        transactionId: 'TXN26011302CD',
        billNumber: 'GAS-2026-005678',
        utilityType: 'GAS',
        amount: 850,
        paymentMethod: 'CARD',
        status: 'SUCCESS',
        timestamp: '2026-01-13T14:15:00Z',
        userPhone: '+91 87654****2',
        kioskId: 'K-007',
    },
    {
        id: '3',
        transactionId: 'TXN26011303EF',
        billNumber: 'WTR-2026-009012',
        utilityType: 'WATER',
        amount: 520,
        paymentMethod: 'UPI',
        status: 'FAILED',
        timestamp: '2026-01-13T13:45:00Z',
        userPhone: '+91 76543****3',
        kioskId: 'K-003',
    },
    {
        id: '4',
        transactionId: 'TXN26011304GH',
        billNumber: 'MUN-2026-012345',
        utilityType: 'MUNICIPAL',
        amount: 3200,
        paymentMethod: 'NETBANKING',
        status: 'SUCCESS',
        timestamp: '2026-01-13T12:00:00Z',
        userPhone: '+91 65432****4',
        kioskId: 'K-015',
    },
    {
        id: '5',
        transactionId: 'TXN26011305IJ',
        billNumber: 'ELEC-2026-002345',
        utilityType: 'ELECTRICITY',
        amount: 1875,
        paymentMethod: 'WALLET',
        status: 'PENDING',
        timestamp: '2026-01-13T11:30:00Z',
        userPhone: '+91 54321****5',
        kioskId: 'K-009',
    },
];

const statusConfig: Record<PaymentStatus, { bg: string; text: string; icon: typeof CheckCircle }> = {
    SUCCESS: { bg: 'bg-green-400/10', text: 'text-green-400', icon: CheckCircle },
    FAILED: { bg: 'bg-red-400/10', text: 'text-red-400', icon: XCircle },
    PENDING: { bg: 'bg-yellow-400/10', text: 'text-yellow-400', icon: Clock },
};

const utilityIcons: Record<UtilityType, typeof Zap> = {
    ELECTRICITY: Zap,
    GAS: Flame,
    WATER: Droplets,
    MUNICIPAL: Building2,
};

const utilityColors: Record<UtilityType, string> = {
    ELECTRICITY: 'text-yellow-400',
    GAS: 'text-orange-400',
    WATER: 'text-blue-400',
    MUNICIPAL: 'text-emerald-400',
};

export default function TransactionsPage() {
    const [transactions] = useState<Transaction[]>(mockTransactions);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'ALL'>('ALL');
    const [utilityFilter, setUtilityFilter] = useState<UtilityType | 'ALL'>('ALL');

    const filteredTransactions = transactions.filter(t => {
        const matchesSearch =
            t.transactionId.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.billNumber.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
        const matchesUtility = utilityFilter === 'ALL' || t.utilityType === utilityFilter;
        return matchesSearch && matchesStatus && matchesUtility;
    });

    const totalAmount = filteredTransactions
        .filter(t => t.status === 'SUCCESS')
        .reduce((sum, t) => sum + t.amount, 0);

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
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Transactions</h1>
                    <p className="text-slate-400 text-sm mt-1">
                        Total collected: <span className="text-green-400 font-medium">{formatCurrency(totalAmount)}</span>
                    </p>
                </div>
                <button className="btn-admin-outline flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Export CSV
                </button>
            </div>

            {/* Filters */}
            <div className="stat-card">
                <div className="flex flex-wrap items-center gap-4">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[250px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by transaction ID or bill number..."
                            className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    {/* Status Filter */}
                    <div className="relative">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as PaymentStatus | 'ALL')}
                            className="appearance-none pl-4 pr-10 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                        >
                            <option value="ALL">All Status</option>
                            <option value="SUCCESS">Success</option>
                            <option value="FAILED">Failed</option>
                            <option value="PENDING">Pending</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>

                    {/* Utility Filter */}
                    <div className="relative">
                        <select
                            value={utilityFilter}
                            onChange={(e) => setUtilityFilter(e.target.value as UtilityType | 'ALL')}
                            className="appearance-none pl-4 pr-10 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                        >
                            <option value="ALL">All Utilities</option>
                            <option value="ELECTRICITY">Electricity</option>
                            <option value="GAS">Gas</option>
                            <option value="WATER">Water</option>
                            <option value="MUNICIPAL">Municipal</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* Transactions Table */}
            <div className="stat-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-slate-400 text-sm border-b border-slate-700">
                                <th className="pb-3 font-medium">Transaction ID</th>
                                <th className="pb-3 font-medium">Bill Number</th>
                                <th className="pb-3 font-medium">Utility</th>
                                <th className="pb-3 font-medium">Amount</th>
                                <th className="pb-3 font-medium">Method</th>
                                <th className="pb-3 font-medium">Status</th>
                                <th className="pb-3 font-medium">Kiosk</th>
                                <th className="pb-3 font-medium">Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTransactions.map((txn) => {
                                const StatusIcon = statusConfig[txn.status]?.icon || Clock;
                                const UtilityIcon = utilityIcons[txn.utilityType];
                                return (
                                    <tr key={txn.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                                        <td className="py-3">
                                            <span className="font-mono text-sm text-blue-400">
                                                {txn.transactionId}
                                            </span>
                                        </td>
                                        <td className="py-3 text-sm">{txn.billNumber}</td>
                                        <td className="py-3">
                                            <div className="flex items-center gap-2">
                                                <UtilityIcon className={`w-4 h-4 ${utilityColors[txn.utilityType]}`} />
                                                <span className="text-sm capitalize">
                                                    {txn.utilityType.toLowerCase()}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-3 font-medium">
                                            {formatCurrency(txn.amount)}
                                        </td>
                                        <td className="py-3">
                                            <div className="flex items-center gap-2">
                                                <CreditCard className="w-4 h-4 text-slate-400" />
                                                <span className="text-sm">{txn.paymentMethod}</span>
                                            </div>
                                        </td>
                                        <td className="py-3">
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${statusConfig[txn.status]?.bg} ${statusConfig[txn.status]?.text}`}>
                                                <StatusIcon className="w-3 h-3" />
                                                {txn.status}
                                            </span>
                                        </td>
                                        <td className="py-3 text-sm text-slate-400">{txn.kioskId}</td>
                                        <td className="py-3 text-sm text-slate-400">
                                            {formatDate(txn.timestamp)}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {filteredTransactions.length === 0 && (
                    <div className="text-center py-12 text-slate-500">
                        No transactions match your filters
                    </div>
                )}
            </div>
        </div>
    );
}
