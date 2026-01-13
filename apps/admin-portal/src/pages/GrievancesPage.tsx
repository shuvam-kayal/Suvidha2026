/**
 * Grievances Management Page - View and manage all complaints
 */

import { useState } from 'react';
import {
    Search, Filter, AlertCircle, Clock, CheckCircle,
    RefreshCw, ChevronDown, Eye,
    Zap, Flame, Droplets, Building2
} from 'lucide-react';

type ComplaintStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'ESCALATED';
type UtilityType = 'ELECTRICITY' | 'GAS' | 'WATER' | 'MUNICIPAL';

interface Complaint {
    id: string;
    ticketNumber: string;
    utilityType: UtilityType;
    category: string;
    subject: string;
    status: ComplaintStatus;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    createdAt: string;
    updatedAt: string;
}

// Mock data
const mockComplaints: Complaint[] = [
    {
        id: 'comp_001',
        ticketNumber: 'GRV-260112-1234',
        utilityType: 'ELECTRICITY',
        category: 'Power Outage',
        subject: 'Frequent power cuts in area',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        createdAt: '2026-01-12T08:30:00Z',
        updatedAt: '2026-01-13T14:00:00Z',
    },
    {
        id: 'comp_002',
        ticketNumber: 'GRV-260113-5678',
        utilityType: 'WATER',
        category: 'No Water Supply',
        subject: 'No water supply for 2 days',
        status: 'OPEN',
        priority: 'URGENT',
        createdAt: '2026-01-13T06:15:00Z',
        updatedAt: '2026-01-13T06:15:00Z',
    },
    {
        id: 'comp_003',
        ticketNumber: 'GRV-260111-3456',
        utilityType: 'GAS',
        category: 'Billing Dispute',
        subject: 'Incorrect bill amount',
        status: 'RESOLVED',
        priority: 'MEDIUM',
        createdAt: '2026-01-11T10:00:00Z',
        updatedAt: '2026-01-13T09:30:00Z',
    },
    {
        id: 'comp_004',
        ticketNumber: 'GRV-260113-7890',
        utilityType: 'MUNICIPAL',
        category: 'Street Light',
        subject: 'Street light not working',
        status: 'OPEN',
        priority: 'LOW',
        createdAt: '2026-01-13T11:45:00Z',
        updatedAt: '2026-01-13T11:45:00Z',
    },
    {
        id: 'comp_005',
        ticketNumber: 'GRV-260110-2345',
        utilityType: 'ELECTRICITY',
        category: 'Meter Issue',
        subject: 'Meter showing incorrect reading',
        status: 'ESCALATED',
        priority: 'HIGH',
        createdAt: '2026-01-10T14:20:00Z',
        updatedAt: '2026-01-12T16:00:00Z',
    },
];

const statusConfig: Record<ComplaintStatus, { bg: string; text: string; icon: typeof CheckCircle }> = {
    OPEN: { bg: 'bg-blue-400/10', text: 'text-blue-400', icon: Clock },
    IN_PROGRESS: { bg: 'bg-yellow-400/10', text: 'text-yellow-400', icon: RefreshCw },
    RESOLVED: { bg: 'bg-green-400/10', text: 'text-green-400', icon: CheckCircle },
    CLOSED: { bg: 'bg-slate-400/10', text: 'text-slate-400', icon: CheckCircle },
    ESCALATED: { bg: 'bg-red-400/10', text: 'text-red-400', icon: AlertCircle },
};

const priorityConfig: Record<string, { bg: string; text: string }> = {
    LOW: { bg: 'bg-slate-400/10', text: 'text-slate-400' },
    MEDIUM: { bg: 'bg-blue-400/10', text: 'text-blue-400' },
    HIGH: { bg: 'bg-orange-400/10', text: 'text-orange-400' },
    URGENT: { bg: 'bg-red-400/10', text: 'text-red-400' },
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

export default function GrievancesPage() {
    const [complaints, setComplaints] = useState<Complaint[]>(mockComplaints);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<ComplaintStatus | 'ALL'>('ALL');
    const [utilityFilter, setUtilityFilter] = useState<UtilityType | 'ALL'>('ALL');

    const filteredComplaints = complaints.filter(c => {
        const matchesSearch =
            c.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.subject.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
        const matchesUtility = utilityFilter === 'ALL' || c.utilityType === utilityFilter;
        return matchesSearch && matchesStatus && matchesUtility;
    });

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
                <h1 className="text-2xl font-bold">Grievance Management</h1>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                    <span>{filteredComplaints.length} complaints</span>
                </div>
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
                            placeholder="Search by ticket or subject..."
                            className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    {/* Status Filter */}
                    <div className="relative">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as ComplaintStatus | 'ALL')}
                            className="appearance-none pl-4 pr-10 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                        >
                            <option value="ALL">All Status</option>
                            <option value="OPEN">Open</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="ESCALATED">Escalated</option>
                            <option value="RESOLVED">Resolved</option>
                            <option value="CLOSED">Closed</option>
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

            {/* Complaints Table */}
            <div className="stat-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-slate-400 text-sm border-b border-slate-700">
                                <th className="pb-3 font-medium">Ticket</th>
                                <th className="pb-3 font-medium">Utility</th>
                                <th className="pb-3 font-medium">Subject</th>
                                <th className="pb-3 font-medium">Status</th>
                                <th className="pb-3 font-medium">Priority</th>
                                <th className="pb-3 font-medium">Created</th>
                                <th className="pb-3 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredComplaints.map((complaint) => {
                                const StatusIcon = statusConfig[complaint.status]?.icon || Clock;
                                const UtilityIcon = utilityIcons[complaint.utilityType];
                                return (
                                    <tr key={complaint.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                                        <td className="py-3">
                                            <span className="font-mono text-sm text-blue-400">
                                                {complaint.ticketNumber}
                                            </span>
                                        </td>
                                        <td className="py-3">
                                            <div className="flex items-center gap-2">
                                                <UtilityIcon className={`w-4 h-4 ${utilityColors[complaint.utilityType]}`} />
                                                <span className="text-sm capitalize">
                                                    {complaint.utilityType.toLowerCase()}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-3">
                                            <div className="max-w-[250px]">
                                                <p className="text-sm truncate">{complaint.subject}</p>
                                                <p className="text-xs text-slate-500">{complaint.category}</p>
                                            </div>
                                        </td>
                                        <td className="py-3">
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${statusConfig[complaint.status]?.bg} ${statusConfig[complaint.status]?.text}`}>
                                                <StatusIcon className="w-3 h-3" />
                                                {complaint.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="py-3">
                                            <span className={`px-2 py-1 rounded text-xs ${priorityConfig[complaint.priority]?.bg} ${priorityConfig[complaint.priority]?.text}`}>
                                                {complaint.priority}
                                            </span>
                                        </td>
                                        <td className="py-3 text-sm text-slate-400">
                                            {formatDate(complaint.createdAt)}
                                        </td>
                                        <td className="py-3">
                                            <button className="p-2 hover:bg-slate-600 rounded-lg transition-colors">
                                                <Eye className="w-4 h-4 text-slate-400" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {filteredComplaints.length === 0 && (
                    <div className="text-center py-12 text-slate-500">
                        No complaints match your filters
                    </div>
                )}
            </div>
        </div>
    );
}
