/**
 * Reports Page - Generate and download reports
 */

import { useState } from 'react';
import {
    FileText, Download, Calendar, ChevronDown,
    BarChart, PieChart, TrendingUp, Clock
} from 'lucide-react';

type ReportType = 'TRANSACTIONS' | 'GRIEVANCES' | 'USERS' | 'SUMMARY';
type DateRange = '7D' | '30D' | '90D' | 'CUSTOM';

interface ReportConfig {
    type: ReportType;
    name: string;
    description: string;
    icon: typeof FileText;
}

const reportTypes: ReportConfig[] = [
    {
        type: 'TRANSACTIONS',
        name: 'Transaction Report',
        description: 'Payment history, revenue, and transaction analytics',
        icon: TrendingUp,
    },
    {
        type: 'GRIEVANCES',
        name: 'Grievance Report',
        description: 'Complaint statistics, resolution times, and trends',
        icon: BarChart,
    },
    {
        type: 'USERS',
        name: 'User Activity Report',
        description: 'User registrations, login patterns, and engagement',
        icon: PieChart,
    },
    {
        type: 'SUMMARY',
        name: 'Executive Summary',
        description: 'High-level overview for management',
        icon: FileText,
    },
];

const dateRanges = [
    { value: '7D', label: 'Last 7 Days' },
    { value: '30D', label: 'Last 30 Days' },
    { value: '90D', label: 'Last 90 Days' },
    { value: 'CUSTOM', label: 'Custom Range' },
];

export default function ReportsPage() {
    const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);
    const [dateRange, setDateRange] = useState<DateRange>('30D');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedReports, setGeneratedReports] = useState<
        { type: ReportType; timestamp: string; url: string }[]
    >([
        { type: 'TRANSACTIONS', timestamp: '2026-01-12T10:30:00Z', url: '#' },
        { type: 'GRIEVANCES', timestamp: '2026-01-10T14:15:00Z', url: '#' },
    ]);

    const handleGenerateReport = async () => {
        if (!selectedReport) return;

        setIsGenerating(true);

        // Simulate report generation
        await new Promise(resolve => setTimeout(resolve, 2000));

        setGeneratedReports(prev => [
            {
                type: selectedReport,
                timestamp: new Date().toISOString(),
                url: '#',
            },
            ...prev,
        ]);

        setIsGenerating(false);
        setSelectedReport(null);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getReportName = (type: ReportType) => {
        return reportTypes.find(r => r.type === type)?.name || type;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Reports</h1>
            </div>

            {/* Report Types */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reportTypes.map((report) => (
                    <button
                        key={report.type}
                        onClick={() => setSelectedReport(report.type)}
                        className={`stat-card text-left transition-all ${selectedReport === report.type
                                ? 'ring-2 ring-blue-500 bg-blue-500/10'
                                : 'hover:bg-slate-700/50'
                            }`}
                    >
                        <div className="flex items-start gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${selectedReport === report.type ? 'bg-blue-500/20' : 'bg-slate-600'
                                }`}>
                                <report.icon className={`w-6 h-6 ${selectedReport === report.type ? 'text-blue-400' : 'text-slate-300'
                                    }`} />
                            </div>
                            <div>
                                <h3 className="font-semibold">{report.name}</h3>
                                <p className="text-sm text-slate-400 mt-1">{report.description}</p>
                            </div>
                        </div>
                    </button>
                ))}
            </div>

            {/* Generate Options */}
            {selectedReport && (
                <div className="stat-card">
                    <h3 className="font-semibold mb-4">Generate {getReportName(selectedReport)}</h3>

                    <div className="flex flex-wrap items-center gap-4">
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <select
                                value={dateRange}
                                onChange={(e) => setDateRange(e.target.value as DateRange)}
                                className="appearance-none pl-10 pr-10 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                            >
                                {dateRanges.map(range => (
                                    <option key={range.value} value={range.value}>{range.label}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>

                        <button
                            onClick={handleGenerateReport}
                            disabled={isGenerating}
                            className="btn-admin-primary flex items-center gap-2"
                        >
                            {isGenerating ? (
                                <>
                                    <Clock className="w-4 h-4 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <FileText className="w-4 h-4" />
                                    Generate Report
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Recent Reports */}
            <div className="stat-card">
                <h3 className="font-semibold mb-4">Recent Reports</h3>

                {generatedReports.length === 0 ? (
                    <p className="text-slate-400 text-sm">No reports generated yet</p>
                ) : (
                    <div className="space-y-3">
                        {generatedReports.map((report, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg"
                            >
                                <div className="flex items-center gap-3">
                                    <FileText className="w-5 h-5 text-blue-400" />
                                    <div>
                                        <p className="font-medium text-sm">{getReportName(report.type)}</p>
                                        <p className="text-xs text-slate-400">{formatDate(report.timestamp)}</p>
                                    </div>
                                </div>
                                <button className="btn-admin-outline flex items-center gap-2 !py-1 !px-3">
                                    <Download className="w-4 h-4" />
                                    Download
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
