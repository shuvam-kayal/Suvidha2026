/**
 * File Complaint Page - Touch-Optimized Complaint Form
 * Step-by-step form for filing grievances
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    AlertCircle, CheckCircle, ChevronRight, ChevronLeft,
    Zap, Flame, Droplets, Building2, RefreshCw, Send
} from 'lucide-react';
import api from '../lib/api';

type UtilityType = 'electricity' | 'gas' | 'water' | 'municipal';

const utilityIcons: Record<string, typeof Zap> = {
    electricity: Zap,
    gas: Flame,
    water: Droplets,
    municipal: Building2,
};

const utilityColors: Record<string, string> = {
    electricity: 'text-yellow-400 bg-yellow-400/10 border-yellow-400',
    gas: 'text-orange-400 bg-orange-400/10 border-orange-400',
    water: 'text-blue-400 bg-blue-400/10 border-blue-400',
    municipal: 'text-emerald-400 bg-emerald-400/10 border-emerald-400',
};

type FormStep = 'utility' | 'category' | 'details' | 'confirm' | 'success';

interface FormData {
    utilityType: UtilityType | null;
    category: string;
    subject: string;
    description: string;
}

export default function FileComplaintPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [step, setStep] = useState<FormStep>('utility');
    const [formData, setFormData] = useState<FormData>({
        utilityType: (searchParams.get('utility') as UtilityType) || null,
        category: '',
        subject: '',
        description: '',
    });
    const [categories, setCategories] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [ticketNumber, setTicketNumber] = useState<string | null>(null);

    // If utility was pre-selected, skip to category
    useEffect(() => {
        if (formData.utilityType && step === 'utility') {
            setStep('category');
        }
    }, []);

    // Fetch categories when utility changes
    useEffect(() => {
        if (formData.utilityType) {
            fetchCategories(formData.utilityType);
        }
    }, [formData.utilityType]);

    const fetchCategories = async (utility: string) => {
        try {
            const response = await api.get(`/grievance/categories?utility=${utility}`);
            setCategories(response.data.categories || []);
        } catch (err) {
            console.error('Failed to fetch categories:', err);
            setCategories([
                'Power Outage', 'Meter Issue', 'Billing Dispute',
                'Service Request', 'Other'
            ]);
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await api.post('/grievance/complaints', {
                utilityType: formData.utilityType?.toUpperCase(),
                category: formData.category,
                subject: formData.subject,
                description: formData.description,
            });

            if (response.data.success) {
                setTicketNumber(response.data.ticketNumber);
                setStep('success');
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to submit complaint');
        } finally {
            setLoading(false);
        }
    };

    const utilities: UtilityType[] = ['electricity', 'gas', 'water', 'municipal'];

    // Step 1: Select Utility
    if (step === 'utility') {
        return (
            <div className="max-w-2xl mx-auto animate-slide-up">
                <h2 className="text-kiosk-2xl font-bold text-center mb-8">
                    {t('grievance.title')}
                </h2>
                <p className="text-kiosk-muted text-center mb-8">
                    Select the service related to your complaint
                </p>

                <div className="grid grid-cols-2 gap-4">
                    {utilities.map((utility) => {
                        const Icon = utilityIcons[utility];
                        const colors = utilityColors[utility].split(' ');
                        return (
                            <button
                                key={utility}
                                onClick={() => {
                                    setFormData({ ...formData, utilityType: utility });
                                    setStep('category');
                                }}
                                className={`service-tile ${colors[1]} hover:${colors[2]}`}
                            >
                                <Icon className={`w-12 h-12 ${colors[0]}`} />
                                <span className="text-kiosk-lg font-semibold">
                                    {t(`services.${utility}`)}
                                </span>
                            </button>
                        );
                    })}
                </div>

                <div className="mt-8 flex justify-center">
                    <button onClick={() => navigate(-1)} className="btn-outline">
                        {t('common.cancel')}
                    </button>
                </div>
            </div>
        );
    }

    // Step 2: Select Category
    if (step === 'category') {
        return (
            <div className="max-w-2xl mx-auto animate-slide-up">
                <h2 className="text-kiosk-xl font-bold text-center mb-6">
                    Select Category
                </h2>

                <div className="space-y-3 mb-8">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => {
                                setFormData({ ...formData, category: cat });
                                setStep('details');
                            }}
                            className={`w-full p-4 rounded-kiosk-lg border-2 text-left flex items-center justify-between transition-colors ${formData.category === cat
                                    ? 'border-primary-500 bg-primary-500/10'
                                    : 'border-kiosk-border hover:border-primary-500/50'
                                }`}
                        >
                            <span className="text-kiosk-base font-medium">{cat}</span>
                            <ChevronRight className="w-6 h-6 text-kiosk-muted" />
                        </button>
                    ))}
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={() => setStep('utility')}
                        className="btn-outline flex-1"
                    >
                        <ChevronLeft className="w-5 h-5" />
                        {t('common.back')}
                    </button>
                </div>
            </div>
        );
    }

    // Step 3: Enter Details
    if (step === 'details') {
        return (
            <div className="max-w-2xl mx-auto animate-slide-up">
                <h2 className="text-kiosk-xl font-bold text-center mb-6">
                    Describe Your Issue
                </h2>

                <div className="card-kiosk space-y-6">
                    <div>
                        <label className="block text-kiosk-sm text-kiosk-muted mb-2">
                            Subject
                        </label>
                        <input
                            type="text"
                            value={formData.subject}
                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                            placeholder="Brief summary of your issue"
                            className="input-kiosk"
                            maxLength={100}
                        />
                    </div>

                    <div>
                        <label className="block text-kiosk-sm text-kiosk-muted mb-2">
                            {t('grievance.description')}
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Please describe your issue in detail (minimum 20 characters)"
                            className="input-kiosk min-h-[150px] resize-none"
                            maxLength={1000}
                        />
                        <p className="text-kiosk-sm text-kiosk-muted mt-1 text-right">
                            {formData.description.length}/1000
                        </p>
                    </div>
                </div>

                {error && (
                    <div className="mt-4 p-4 bg-error/20 border border-error rounded-kiosk flex items-center gap-3">
                        <AlertCircle className="w-6 h-6 text-error flex-shrink-0" />
                        <p className="text-red-300">{error}</p>
                    </div>
                )}

                <div className="mt-6 flex gap-4">
                    <button
                        onClick={() => setStep('category')}
                        className="btn-outline flex-1"
                    >
                        <ChevronLeft className="w-5 h-5" />
                        {t('common.back')}
                    </button>
                    <button
                        onClick={() => setStep('confirm')}
                        disabled={formData.subject.length < 5 || formData.description.length < 20}
                        className="btn-primary flex-1"
                    >
                        Review
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>
        );
    }

    // Step 4: Confirm
    if (step === 'confirm') {
        const UtilityIcon = utilityIcons[formData.utilityType || 'electricity'];
        return (
            <div className="max-w-2xl mx-auto animate-slide-up">
                <h2 className="text-kiosk-xl font-bold text-center mb-6">
                    Review Your Complaint
                </h2>

                <div className="card-kiosk">
                    <div className="flex items-center gap-3 mb-6 pb-6 border-b border-kiosk-border">
                        <UtilityIcon className={`w-8 h-8 ${utilityColors[formData.utilityType || 'electricity'].split(' ')[0]}`} />
                        <div>
                            <p className="font-semibold">{t(`services.${formData.utilityType}`)}</p>
                            <p className="text-kiosk-sm text-kiosk-muted">{formData.category}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <p className="text-kiosk-sm text-kiosk-muted">Subject</p>
                            <p className="font-medium">{formData.subject}</p>
                        </div>
                        <div>
                            <p className="text-kiosk-sm text-kiosk-muted">Description</p>
                            <p className="text-kiosk-base whitespace-pre-wrap">{formData.description}</p>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="mt-4 p-4 bg-error/20 border border-error rounded-kiosk flex items-center gap-3">
                        <AlertCircle className="w-6 h-6 text-error flex-shrink-0" />
                        <p className="text-red-300">{error}</p>
                    </div>
                )}

                <div className="mt-6 flex gap-4">
                    <button
                        onClick={() => setStep('details')}
                        disabled={loading}
                        className="btn-outline flex-1"
                    >
                        <ChevronLeft className="w-5 h-5" />
                        Edit
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="btn-primary flex-1"
                    >
                        {loading ? (
                            <>
                                <RefreshCw className="w-5 h-5 animate-spin" />
                                Submitting...
                            </>
                        ) : (
                            <>
                                <Send className="w-5 h-5" />
                                {t('common.submit')}
                            </>
                        )}
                    </button>
                </div>
            </div>
        );
    }

    // Step 5: Success
    if (step === 'success') {
        return (
            <div className="max-w-2xl mx-auto animate-slide-up">
                <div className="card-kiosk text-center">
                    <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-14 h-14 text-green-400" />
                    </div>

                    <h2 className="text-kiosk-2xl font-bold text-green-400 mb-2">
                        Complaint Registered!
                    </h2>
                    <p className="text-kiosk-muted mb-8">
                        Your complaint has been submitted successfully
                    </p>

                    <div className="bg-kiosk-bg rounded-kiosk-lg p-6 mb-8">
                        <p className="text-kiosk-muted mb-2">{t('grievance.ticketNumber')}</p>
                        <p className="text-kiosk-2xl font-mono font-bold text-primary-400">
                            {ticketNumber}
                        </p>
                        <p className="text-kiosk-sm text-kiosk-muted mt-4">
                            Please save this number to track your complaint status
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={() => navigate(`/grievance/track/${ticketNumber}`)}
                            className="btn-outline flex-1"
                        >
                            Track Status
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

    return null;
}
