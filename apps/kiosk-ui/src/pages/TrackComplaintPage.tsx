/**
 * Track Complaint Page - Look up complaint by ticket number
 */

import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Search, AlertCircle, Clock, CheckCircle,
    RefreshCw, ArrowLeft,
    Zap, Flame, Droplets, Building2
} from 'lucide-react';
import api from '../lib/api';

const statusColors: Record<string, { bg: string; text: string; icon: typeof CheckCircle }> = {
    OPEN: { bg: 'bg-blue-500/20', text: 'text-blue-400', icon: Clock },
    IN_PROGRESS: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', icon: RefreshCw },
    RESOLVED: { bg: 'bg-green-500/20', text: 'text-green-400', icon: CheckCircle },
    CLOSED: { bg: 'bg-gray-500/20', text: 'text-gray-400', icon: CheckCircle },
    ESCALATED: { bg: 'bg-red-500/20', text: 'text-red-400', icon: AlertCircle },
};

const utilityIcons: Record<string, typeof Zap> = {
    ELECTRICITY: Zap,
    GAS: Flame,
    WATER: Droplets,
    MUNICIPAL: Building2,
};

interface ComplaintUpdate {
    id: string;
    message: string;
    createdBy: string;
    createdAt: string;
}

interface Complaint {
    id: string;
    ticketNumber: string;
    utilityType: string;
    category: string;
    subject: string;
    description: string;
    status: string;
    priority: string;
    createdAt: string;
    updatedAt: string;
    updates: ComplaintUpdate[];
}

export default function TrackComplaintPage() {
    const { ticketNumber: urlTicket } = useParams<{ ticketNumber: string }>();
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [ticketInput, setTicketInput] = useState(urlTicket || '');
    const [complaint, setComplaint] = useState<Complaint | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searched, setSearched] = useState(!!urlTicket);

    // Auto-search if ticket in URL
    useState(() => {
        if (urlTicket) {
            handleSearch(urlTicket);
        }
    });

    async function handleSearch(ticket?: string) {
        const searchTicket = ticket || ticketInput.trim();
        if (!searchTicket) return;

        setLoading(true);
        setError(null);
        setSearched(true);

        try {
            const response = await api.get(`/grievance/complaints/track/${searchTicket}`);
            if (response.data.success) {
                setComplaint(response.data.complaint);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Complaint not found');
            setComplaint(null);
        } finally {
            setLoading(false);
        }
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // Search Form
    if (!searched || !complaint) {
        return (
            <div className="max-w-2xl mx-auto animate-slide-up">
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => navigate(-1)}
                        className="btn-outline !min-h-12 !min-w-12 !p-3"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h2 className="text-kiosk-xl font-bold">{t('services.trackGrievance')}</h2>
                </div>

                <div className="card-kiosk">
                    <p className="text-kiosk-muted mb-6 text-center">
                        Enter your complaint ticket number to check status
                    </p>

                    <div className="relative mb-6">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-kiosk-muted" />
                        <input
                            type="text"
                            value={ticketInput}
                            onChange={(e) => setTicketInput(e.target.value.toUpperCase())}
                            placeholder="e.g., GRV-260112-1234"
                            className="input-kiosk pl-14 text-center font-mono text-kiosk-lg tracking-wider"
                            maxLength={20}
                        />
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-error/20 border border-error rounded-kiosk flex items-center gap-3">
                            <AlertCircle className="w-6 h-6 text-error flex-shrink-0" />
                            <p className="text-red-300">{error}</p>
                        </div>
                    )}

                    <button
                        onClick={() => handleSearch()}
                        disabled={!ticketInput.trim() || loading}
                        className="btn-primary w-full"
                    >
                        {loading ? (
                            <>
                                <RefreshCw className="w-5 h-5 animate-spin" />
                                Searching...
                            </>
                        ) : (
                            <>
                                <Search className="w-5 h-5" />
                                Track Complaint
                            </>
                        )}
                    </button>

                    <div className="mt-8 pt-6 border-t border-kiosk-border text-center">
                        <p className="text-kiosk-muted mb-4">Don't have a ticket number?</p>
                        <button
                            onClick={() => navigate('/grievance/new')}
                            className="btn-outline"
                        >
                            File New Complaint
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Complaint Details
    const StatusIcon = statusColors[complaint.status]?.icon || Clock;
    const UtilityIcon = utilityIcons[complaint.utilityType] || Zap;

    return (
        <div className="max-w-2xl mx-auto animate-slide-up">
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => {
                        setSearched(false);
                        setComplaint(null);
                        setTicketInput('');
                    }}
                    className="btn-outline !min-h-12 !min-w-12 !p-3"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <div>
                    <p className="text-kiosk-sm text-kiosk-muted">{t('grievance.ticketNumber')}</p>
                    <p className="text-kiosk-lg font-mono font-bold">{complaint.ticketNumber}</p>
                </div>
            </div>

            {/* Status Card */}
            <div className="card-kiosk mb-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <UtilityIcon className="w-8 h-8 text-primary-400" />
                        <div>
                            <p className="font-semibold">{complaint.category}</p>
                            <p className="text-kiosk-sm text-kiosk-muted">{complaint.utilityType}</p>
                        </div>
                    </div>
                    <span className={`px-4 py-2 rounded-full flex items-center gap-2 ${statusColors[complaint.status]?.bg} ${statusColors[complaint.status]?.text}`}>
                        <StatusIcon className="w-4 h-4" />
                        {complaint.status.replace('_', ' ')}
                    </span>
                </div>

                <div className="space-y-4">
                    <div>
                        <p className="text-kiosk-sm text-kiosk-muted">Subject</p>
                        <p className="font-medium">{complaint.subject}</p>
                    </div>
                    <div>
                        <p className="text-kiosk-sm text-kiosk-muted">Description</p>
                        <p className="text-kiosk-base">{complaint.description}</p>
                    </div>
                    <div className="flex justify-between text-kiosk-sm">
                        <span className="text-kiosk-muted">Filed on</span>
                        <span>{formatDate(complaint.createdAt)}</span>
                    </div>
                </div>
            </div>

            {/* Updates Timeline */}
            <div className="card-kiosk">
                <h3 className="text-kiosk-lg font-semibold mb-4">Status Updates</h3>
                <div className="space-y-4">
                    {complaint.updates.map((update, index) => (
                        <div key={update.id} className="relative pl-6">
                            {/* Timeline line */}
                            {index < complaint.updates.length - 1 && (
                                <div className="absolute left-[7px] top-6 bottom-0 w-0.5 bg-kiosk-border" />
                            )}
                            {/* Timeline dot */}
                            <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-primary-500 border-2 border-kiosk-card" />

                            <div className="pb-4">
                                <p className="text-kiosk-base">{update.message}</p>
                                <p className="text-kiosk-sm text-kiosk-muted mt-1">
                                    {update.createdBy} • {formatDate(update.createdAt)}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex gap-4">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="btn-outline flex-1"
                >
                    {t('common.home')}
                </button>
                <button
                    onClick={() => navigate('/grievance/new')}
                    className="btn-primary flex-1"
                >
                    File New Complaint
                </button>
            </div>
        </div>
    );
}
