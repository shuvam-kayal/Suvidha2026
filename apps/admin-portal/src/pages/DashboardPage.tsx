/**
 * Admin Dashboard - Overview Page
 */

import { Monitor, Users, AlertCircle, CreditCard, TrendingUp, TrendingDown } from 'lucide-react';

const stats = [
    { label: 'Active Kiosks', value: '24', icon: Monitor, trend: '+2', up: true },
    { label: 'Total Users', value: '12,450', icon: Users, trend: '+156', up: true },
    { label: 'Open Grievances', value: '47', icon: AlertCircle, trend: '-8', up: false },
    { label: 'Today\'s Transactions', value: '₹2,34,500', icon: CreditCard, trend: '+12%', up: true },
];

export default function DashboardPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Dashboard Overview</h1>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => (
                    <div key={stat.label} className="stat-card">
                        <div className="flex items-center justify-between mb-4">
                            <stat.icon className="w-8 h-8 text-blue-400" />
                            <span
                                className={`flex items-center gap-1 text-sm ${stat.up ? 'text-green-400' : 'text-red-400'
                                    }`}
                            >
                                {stat.up ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                {stat.trend}
                            </span>
                        </div>
                        <p className="text-3xl font-bold">{stat.value}</p>
                        <p className="text-slate-400">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Placeholder sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="stat-card">
                    <h3 className="text-lg font-semibold mb-4">Transaction Trend</h3>
                    <div className="h-64 flex items-center justify-center text-slate-500">
                        Chart placeholder - Recharts integration pending
                    </div>
                </div>
                <div className="stat-card">
                    <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                    <div className="h-64 flex items-center justify-center text-slate-500">
                        Activity feed placeholder
                    </div>
                </div>
            </div>
        </div>
    );
}
