/**
 * User Management Page - Admin interface for managing users
 */

import { useState } from 'react';
import {
    Search, User, Phone,
    MoreVertical, Eye, Ban, Trash2, ChevronDown
} from 'lucide-react';

interface UserRecord {
    id: string;
    phone: string;
    name: string;
    registeredAt: string;
    lastLogin: string;
    status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
    totalTransactions: number;
    totalGrievances: number;
}

// Mock data
const mockUsers: UserRecord[] = [
    {
        id: 'usr_001',
        phone: '+91 98765 43210',
        name: 'Rajesh Kumar',
        registeredAt: '2025-06-15T10:30:00Z',
        lastLogin: '2026-01-13T14:30:00Z',
        status: 'ACTIVE',
        totalTransactions: 24,
        totalGrievances: 2,
    },
    {
        id: 'usr_002',
        phone: '+91 87654 32109',
        name: 'Priya Sharma',
        registeredAt: '2025-08-22T09:15:00Z',
        lastLogin: '2026-01-12T11:00:00Z',
        status: 'ACTIVE',
        totalTransactions: 18,
        totalGrievances: 0,
    },
    {
        id: 'usr_003',
        phone: '+91 76543 21098',
        name: 'Amit Patel',
        registeredAt: '2025-09-10T14:45:00Z',
        lastLogin: '2026-01-10T16:20:00Z',
        status: 'BLOCKED',
        totalTransactions: 5,
        totalGrievances: 1,
    },
    {
        id: 'usr_004',
        phone: '+91 65432 10987',
        name: 'Sunita Devi',
        registeredAt: '2025-11-28T08:00:00Z',
        lastLogin: '2025-12-15T10:00:00Z',
        status: 'INACTIVE',
        totalTransactions: 3,
        totalGrievances: 0,
    },
];

const statusConfig = {
    ACTIVE: { bg: 'bg-green-400/10', text: 'text-green-400' },
    INACTIVE: { bg: 'bg-slate-400/10', text: 'text-slate-400' },
    BLOCKED: { bg: 'bg-red-400/10', text: 'text-red-400' },
};

export default function UsersPage() {
    const [users] = useState<UserRecord[]>(mockUsers);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [selectedUser, setSelectedUser] = useState<string | null>(null);

    const filteredUsers = users.filter(user => {
        const matchesSearch =
            user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.phone.includes(searchQuery);
        const matchesStatus = statusFilter === 'ALL' || user.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const handleAction = (action: string, userId: string) => {
        console.log(`Action: ${action} for user: ${userId}`);
        setSelectedUser(null);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">User Management</h1>
                    <p className="text-slate-400 text-sm mt-1">
                        {filteredUsers.length} registered users
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="stat-card">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="relative flex-1 min-w-[250px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by name or phone..."
                            className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    <div className="relative">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="appearance-none pl-4 pr-10 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                        >
                            <option value="ALL">All Status</option>
                            <option value="ACTIVE">Active</option>
                            <option value="INACTIVE">Inactive</option>
                            <option value="BLOCKED">Blocked</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* Users Table */}
            <div className="stat-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-slate-400 text-sm border-b border-slate-700">
                                <th className="pb-3 font-medium">User</th>
                                <th className="pb-3 font-medium">Phone</th>
                                <th className="pb-3 font-medium">Status</th>
                                <th className="pb-3 font-medium">Registered</th>
                                <th className="pb-3 font-medium">Last Login</th>
                                <th className="pb-3 font-medium">Txns/Complaints</th>
                                <th className="pb-3 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                                    <td className="py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center">
                                                <User className="w-5 h-5 text-slate-300" />
                                            </div>
                                            <span className="font-medium">{user.name}</span>
                                        </div>
                                    </td>
                                    <td className="py-3">
                                        <div className="flex items-center gap-2">
                                            <Phone className="w-4 h-4 text-slate-400" />
                                            <span className="text-sm">{user.phone}</span>
                                        </div>
                                    </td>
                                    <td className="py-3">
                                        <span className={`px-2 py-1 rounded text-xs ${statusConfig[user.status]?.bg} ${statusConfig[user.status]?.text}`}>
                                            {user.status}
                                        </span>
                                    </td>
                                    <td className="py-3 text-sm text-slate-400">
                                        {formatDate(user.registeredAt)}
                                    </td>
                                    <td className="py-3 text-sm text-slate-400">
                                        {formatDate(user.lastLogin)}
                                    </td>
                                    <td className="py-3">
                                        <div className="text-sm">
                                            <span className="text-green-400">{user.totalTransactions}</span>
                                            <span className="text-slate-500 mx-1">/</span>
                                            <span className="text-amber-400">{user.totalGrievances}</span>
                                        </div>
                                    </td>
                                    <td className="py-3">
                                        <div className="relative">
                                            <button
                                                onClick={() => setSelectedUser(selectedUser === user.id ? null : user.id)}
                                                className="p-2 hover:bg-slate-600 rounded-lg transition-colors"
                                            >
                                                <MoreVertical className="w-4 h-4 text-slate-400" />
                                            </button>

                                            {selectedUser === user.id && (
                                                <div className="absolute right-0 mt-1 w-40 bg-slate-700 border border-slate-600 rounded-lg shadow-lg z-10">
                                                    <button
                                                        onClick={() => handleAction('view', user.id)}
                                                        className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-600"
                                                    >
                                                        <Eye className="w-4 h-4" /> View Details
                                                    </button>
                                                    <button
                                                        onClick={() => handleAction('block', user.id)}
                                                        className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-600"
                                                    >
                                                        <Ban className="w-4 h-4" />
                                                        {user.status === 'BLOCKED' ? 'Unblock' : 'Block'}
                                                    </button>
                                                    <button
                                                        onClick={() => handleAction('delete', user.id)}
                                                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-slate-600"
                                                    >
                                                        <Trash2 className="w-4 h-4" /> Delete
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
