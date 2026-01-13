/**
 * Admin Dashboard - Overview with Real Stats and Charts
 */

import { useState, useEffect } from 'react';
import {
    Monitor, Users, AlertCircle, CreditCard,
    TrendingUp, TrendingDown, RefreshCw,
    Zap, Flame, Droplets, Building2,
    Clock, CheckCircle
} from 'lucide-react';

interface DashboardStats {
    activeKiosks: number;
    totalUsers: number;
    openGrievances: number;
    todayTransactions: number;
    pendingBills: number;
    resolvedToday: number;
}

interface RecentActivity {
    id: string;
    type: 'payment' | 'grievance' | 'login';
    message: string;
    timestamp: string;
    utility?: string;
}

interface GrievanceSummary {
    utility: string;
    open: number;
    inProgress: number;
    resolved: number;
}

// Mock data - in production, fetch from API
const mockStats: DashboardStats = {
    activeKiosks: 24,
    totalUsers: 12450,
    openGrievances: 47,
    todayTransactions: 234500,
    pendingBills: 1823,
    resolvedToday: 15,
};

const mockActivities: RecentActivity[] = [
    { id: '1', type: 'payment', message: 'Payment of ₹2,450 received for ELEC-2026-001234', timestamp: '2 min ago', utility: 'ELECTRICITY' },
    { id: '2', type: 'grievance', message: 'New complaint GRV-260113-4521 filed for Water supply', timestamp: '5 min ago', utility: 'WATER' },
    { id: '3', type: 'payment', message: 'Payment of ₹850 received for GAS-2026-005678', timestamp: '8 min ago', utility: 'GAS' },
    { id: '4', type: 'login', message: 'User +91 98765****1 logged in at Kiosk #12', timestamp: '12 min ago' },
    { id: '5', type: 'grievance', message: 'Complaint GRV-260112-1234 marked as resolved', timestamp: '15 min ago', utility: 'ELECTRICITY' },
];

const grievanceSummary: GrievanceSummary[] = [
    { utility: 'ELECTRICITY', open: 18, inProgress: 12, resolved: 45 },
    { utility: 'GAS', open: 8, inProgress: 5, resolved: 22 },
    { utility: 'WATER', open: 15, inProgress: 8, resolved: 38 },
    { utility: 'MUNICIPAL', open: 6, inProgress: 4, resolved: 28 },
];

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

export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats>(mockStats);
    const [activities, setActivities] = useState<RecentActivity[]>(mockActivities);
    const [loading, setLoading] = useState(false);

    const refreshData = async () => {
        setLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setLoading(false);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const statCards = [
        {
            label: 'Active Kiosks',
            value: stats.activeKiosks.toString(),
            icon: Monitor,
            trend: '+2',
            up: true,
            color: 'text-blue-400',
            bg: 'bg-blue-400/10'
        },
        {
            label: 'Total Users',
            value: stats.totalUsers.toLocaleString(),
            icon: Users,
            trend: '+156',
            up: true,
            color: 'text-emerald-400',
            bg: 'bg-emerald-400/10'
        },
        {
            label: 'Open Grievances',
            value: stats.openGrievances.toString(),
            icon: AlertCircle,
            trend: '-8',
            up: false,
            color: 'text-amber-400',
            bg: 'bg-amber-400/10'
        },
        {
            label: "Today's Revenue",
            value: formatCurrency(stats.todayTransactions),
            icon: CreditCard,
            trend: '+12%',
            up: true,
            color: 'text-purple-400',
            bg: 'bg-purple-400/10'
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Dashboard Overview</h1>
                <button
                    onClick={refreshData}
                    disabled={loading}
                    className="btn-admin-primary flex items-center gap-2"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat) => (
                    <div key={stat.label} className="stat-card">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center`}>
                                <stat.icon className={`w-6 h-6 ${stat.color}`} />
                            </div>
                            <span
                                className={`flex items-center gap-1 text-sm px-2 py-1 rounded-full ${stat.up
                                        ? 'text-green-400 bg-green-400/10'
                                        : 'text-red-400 bg-red-400/10'
                                    }`}
                            >
                                {stat.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                {stat.trend}
                            </span>
                        </div>
                        <p className="text-3xl font-bold">{stat.value}</p>
                        <p className="text-slate-400 text-sm mt-1">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Grievance Summary */}
                <div className="stat-card lg:col-span-2">
                    <h3 className="text-lg font-semibold mb-4">Grievance Overview by Utility</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left text-slate-400 text-sm border-b border-slate-700">
                                    <th className="pb-3">Utility</th>
                                    <th className="pb-3 text-center">Open</th>
                                    <th className="pb-3 text-center">In Progress</th>
                                    <th className="pb-3 text-center">Resolved</th>
                                    <th className="pb-3 text-center">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {grievanceSummary.map((item) => {
                                    const Icon = utilityIcons[item.utility];
                                    const color = utilityColors[item.utility];
                                    const total = item.open + item.inProgress + item.resolved;
                                    return (
                                        <tr key={item.utility} className="border-b border-slate-700/50">
                                            <td className="py-3">
                                                <div className="flex items-center gap-2">
                                                    <Icon className={`w-5 h-5 ${color}`} />
                                                    <span className="capitalize">{item.utility.toLowerCase()}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 text-center">
                                                <span className="px-2 py-1 rounded bg-red-400/10 text-red-400 text-sm">
                                                    {item.open}
                                                </span>
                                            </td>
                                            <td className="py-3 text-center">
                                                <span className="px-2 py-1 rounded bg-yellow-400/10 text-yellow-400 text-sm">
                                                    {item.inProgress}
                                                </span>
                                            </td>
                                            <td className="py-3 text-center">
                                                <span className="px-2 py-1 rounded bg-green-400/10 text-green-400 text-sm">
                                                    {item.resolved}
                                                </span>
                                            </td>
                                            <td className="py-3 text-center font-medium">{total}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="stat-card">
                    <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
                            <div className="flex items-center gap-3">
                                <Clock className="w-5 h-5 text-amber-400" />
                                <span className="text-slate-300">Pending Bills</span>
                            </div>
                            <span className="font-bold text-amber-400">{stats.pendingBills.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
                            <div className="flex items-center gap-3">
                                <CheckCircle className="w-5 h-5 text-green-400" />
                                <span className="text-slate-300">Resolved Today</span>
                            </div>
                            <span className="font-bold text-green-400">{stats.resolvedToday}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
                            <div className="flex items-center gap-3">
                                <Monitor className="w-5 h-5 text-blue-400" />
                                <span className="text-slate-300">Offline Kiosks</span>
                            </div>
                            <span className="font-bold text-red-400">2</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="stat-card">
                <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                <div className="space-y-3">
                    {activities.map((activity) => (
                        <div
                            key={activity.id}
                            className="flex items-start gap-3 p-3 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors"
                        >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${activity.type === 'payment'
                                    ? 'bg-green-400/20'
                                    : activity.type === 'grievance'
                                        ? 'bg-amber-400/20'
                                        : 'bg-blue-400/20'
                                }`}>
                                {activity.type === 'payment' && <CreditCard className="w-4 h-4 text-green-400" />}
                                {activity.type === 'grievance' && <AlertCircle className="w-4 h-4 text-amber-400" />}
                                {activity.type === 'login' && <Users className="w-4 h-4 text-blue-400" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-slate-200">{activity.message}</p>
                                <p className="text-xs text-slate-500 mt-1">{activity.timestamp}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
