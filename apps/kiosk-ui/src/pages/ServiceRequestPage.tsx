/**
 * ServiceRequestPage - Multi-step Service Request Form
 * For New Connections, Address Changes, and Bulk Waste Pickup
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    ArrowLeft, ArrowRight, Check, User, MapPin, Zap, Loader2,
    Home, Truck, FileEdit, AlertCircle, CheckCircle2
} from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

type RequestType = 'NEW_CONNECTION' | 'ADDRESS_CHANGE' | 'BULK_WASTE';
type UtilityType = 'ELECTRICITY' | 'WATER' | 'GAS' | 'MUNICIPAL';

interface FormData {
    requestType: RequestType | null;
    utilityType: UtilityType | null;
    fullName: string;
    phoneNumber: string;
    email: string;
    currentAddress: string;
    newAddress: string;
    loadRequirement: string;
    propertyType: string;
    notes: string;
    pickupDate: string;
    wasteType: string;
}

const initialFormData: FormData = {
    requestType: null,
    utilityType: null,
    fullName: '',
    phoneNumber: '',
    email: '',
    currentAddress: '',
    newAddress: '',
    loadRequirement: '1-5 kW',
    propertyType: 'residential',
    notes: '',
    pickupDate: '',
    wasteType: 'household',
};

// =============================================================================
// CONSTANTS
// =============================================================================

const REQUEST_TYPES = [
    {
        id: 'NEW_CONNECTION' as RequestType,
        label: 'New Connection',
        description: 'Apply for a new utility connection',
        icon: Zap,
        color: 'from-blue-500 to-cyan-500',
    },
    {
        id: 'ADDRESS_CHANGE' as RequestType,
        label: 'Address Change',
        description: 'Update your service address',
        icon: FileEdit,
        color: 'from-purple-500 to-pink-500',
    },
    {
        id: 'BULK_WASTE' as RequestType,
        label: 'Bulk Waste Pickup',
        description: 'Schedule bulk waste collection',
        icon: Truck,
        color: 'from-green-500 to-emerald-500',
    },
];

const UTILITY_TYPES = [
    { id: 'ELECTRICITY' as UtilityType, label: 'Electricity', icon: Zap },
    { id: 'WATER' as UtilityType, label: 'Water', icon: Home },
    { id: 'GAS' as UtilityType, label: 'Gas', icon: Home },
    { id: 'MUNICIPAL' as UtilityType, label: 'Municipal', icon: Home },
];

const LOAD_REQUIREMENTS = ['1-5 kW', '5-10 kW', '10-20 kW', '20+ kW'];
const PROPERTY_TYPES = ['residential', 'commercial', 'industrial', 'agricultural'];
const WASTE_TYPES = ['household', 'garden', 'electronic', 'furniture', 'construction'];

// =============================================================================
// API
// =============================================================================

const API_URL = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:3000';

async function submitRequest(formData: FormData): Promise<{ success: boolean; requestNumber?: string; error?: string }> {
    try {
        const response = await fetch(`${API_URL}/api/v1/grievance/service-requests`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: JSON.stringify({
                requestType: formData.requestType,
                utilityType: formData.utilityType,
                formData: {
                    fullName: formData.fullName,
                    phoneNumber: formData.phoneNumber,
                    email: formData.email,
                    currentAddress: formData.currentAddress,
                    newAddress: formData.newAddress,
                    loadRequirement: formData.loadRequirement,
                    propertyType: formData.propertyType,
                    notes: formData.notes,
                    pickupDate: formData.pickupDate,
                    wasteType: formData.wasteType,
                },
            }),
        });

        const data = await response.json();
        if (response.ok) {
            return { success: true, requestNumber: data.requestNumber };
        }
        return { success: false, error: data.detail?.error || 'Submission failed' };
    } catch (error) {
        return { success: false, error: 'Network error. Please try again.' };
    }
}

// =============================================================================
// STEP COMPONENTS
// =============================================================================

function StepIndicator({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
    return (
        <div className="flex items-center justify-center gap-2 mb-8">
            {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                    key={i}
                    className={`h-2 rounded-full transition-all ${i < currentStep
                            ? 'w-8 bg-kiosk-accent'
                            : i === currentStep
                                ? 'w-12 bg-kiosk-primary'
                                : 'w-8 bg-kiosk-border'
                        }`}
                />
            ))}
        </div>
    );
}

function RequestTypeStep({
    selected,
    onSelect,
}: {
    selected: RequestType | null;
    onSelect: (type: RequestType) => void;
}) {
    return (
        <div className="space-y-6">
            <h2 className="text-kiosk-2xl font-semibold text-center mb-8">
                What would you like to do?
            </h2>
            <div className="grid gap-4">
                {REQUEST_TYPES.map((type) => {
                    const Icon = type.icon;
                    const isSelected = selected === type.id;
                    return (
                        <button
                            key={type.id}
                            onClick={() => onSelect(type.id)}
                            className={`relative p-6 rounded-2xl border-2 transition-all text-left ${isSelected
                                    ? 'border-kiosk-primary bg-kiosk-primary/10'
                                    : 'border-kiosk-border hover:border-kiosk-muted bg-kiosk-card'
                                }`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-xl bg-gradient-to-br ${type.color}`}>
                                    <Icon className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-kiosk-lg font-medium">{type.label}</h3>
                                    <p className="text-kiosk-sm text-kiosk-muted">{type.description}</p>
                                </div>
                                {isSelected && (
                                    <Check className="w-6 h-6 text-kiosk-primary" />
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

function UtilityTypeStep({
    selected,
    onSelect,
    requestType,
}: {
    selected: UtilityType | null;
    onSelect: (type: UtilityType) => void;
    requestType: RequestType;
}) {
    // For bulk waste, only show Municipal
    const types = requestType === 'BULK_WASTE'
        ? UTILITY_TYPES.filter((t) => t.id === 'MUNICIPAL')
        : UTILITY_TYPES;

    return (
        <div className="space-y-6">
            <h2 className="text-kiosk-2xl font-semibold text-center mb-8">
                Select Utility Type
            </h2>
            <div className="grid grid-cols-2 gap-4">
                {types.map((type) => {
                    const Icon = type.icon;
                    const isSelected = selected === type.id;
                    return (
                        <button
                            key={type.id}
                            onClick={() => onSelect(type.id)}
                            className={`p-6 rounded-2xl border-2 transition-all ${isSelected
                                    ? 'border-kiosk-primary bg-kiosk-primary/10'
                                    : 'border-kiosk-border hover:border-kiosk-muted bg-kiosk-card'
                                }`}
                        >
                            <Icon className={`w-8 h-8 mx-auto mb-3 ${isSelected ? 'text-kiosk-primary' : 'text-kiosk-muted'}`} />
                            <p className="font-medium text-center">{type.label}</p>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

function PersonalDetailsStep({
    formData,
    onChange,
}: {
    formData: FormData;
    onChange: (field: keyof FormData, value: string) => void;
}) {
    return (
        <div className="space-y-6">
            <h2 className="text-kiosk-2xl font-semibold text-center mb-8">
                Personal Details
            </h2>
            <div className="space-y-4">
                <div>
                    <label className="block text-kiosk-sm text-kiosk-muted mb-2">Full Name *</label>
                    <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-kiosk-muted" />
                        <input
                            type="text"
                            value={formData.fullName}
                            onChange={(e) => onChange('fullName', e.target.value)}
                            placeholder="Enter your full name"
                            className="w-full pl-12 pr-4 py-4 bg-kiosk-card border border-kiosk-border rounded-xl
                                       focus:outline-none focus:ring-2 focus:ring-kiosk-primary text-kiosk-lg"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-kiosk-sm text-kiosk-muted mb-2">Phone Number *</label>
                    <input
                        type="tel"
                        value={formData.phoneNumber}
                        onChange={(e) => onChange('phoneNumber', e.target.value)}
                        placeholder="10-digit mobile number"
                        className="w-full px-4 py-4 bg-kiosk-card border border-kiosk-border rounded-xl
                                   focus:outline-none focus:ring-2 focus:ring-kiosk-primary text-kiosk-lg"
                    />
                </div>
                <div>
                    <label className="block text-kiosk-sm text-kiosk-muted mb-2">Email (Optional)</label>
                    <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => onChange('email', e.target.value)}
                        placeholder="email@example.com"
                        className="w-full px-4 py-4 bg-kiosk-card border border-kiosk-border rounded-xl
                                   focus:outline-none focus:ring-2 focus:ring-kiosk-primary text-kiosk-lg"
                    />
                </div>
            </div>
        </div>
    );
}

function AddressStep({
    formData,
    onChange,
    requestType,
}: {
    formData: FormData;
    onChange: (field: keyof FormData, value: string) => void;
    requestType: RequestType;
}) {
    const showNewAddress = requestType === 'ADDRESS_CHANGE';
    const showLoadRequirement = requestType === 'NEW_CONNECTION' && formData.utilityType === 'ELECTRICITY';

    return (
        <div className="space-y-6">
            <h2 className="text-kiosk-2xl font-semibold text-center mb-8">
                {requestType === 'ADDRESS_CHANGE' ? 'Address Details' : 'Service Location'}
            </h2>
            <div className="space-y-4">
                <div>
                    <label className="block text-kiosk-sm text-kiosk-muted mb-2">
                        {showNewAddress ? 'Current Address *' : 'Service Address *'}
                    </label>
                    <div className="relative">
                        <MapPin className="absolute left-4 top-4 w-5 h-5 text-kiosk-muted" />
                        <textarea
                            value={formData.currentAddress}
                            onChange={(e) => onChange('currentAddress', e.target.value)}
                            placeholder="Enter full address with landmark"
                            rows={3}
                            className="w-full pl-12 pr-4 py-4 bg-kiosk-card border border-kiosk-border rounded-xl
                                       focus:outline-none focus:ring-2 focus:ring-kiosk-primary text-kiosk-base resize-none"
                        />
                    </div>
                </div>

                {showNewAddress && (
                    <div>
                        <label className="block text-kiosk-sm text-kiosk-muted mb-2">New Address *</label>
                        <textarea
                            value={formData.newAddress}
                            onChange={(e) => onChange('newAddress', e.target.value)}
                            placeholder="Enter new address with landmark"
                            rows={3}
                            className="w-full px-4 py-4 bg-kiosk-card border border-kiosk-border rounded-xl
                                       focus:outline-none focus:ring-2 focus:ring-kiosk-primary text-kiosk-base resize-none"
                        />
                    </div>
                )}

                <div>
                    <label className="block text-kiosk-sm text-kiosk-muted mb-2">Property Type *</label>
                    <select
                        value={formData.propertyType}
                        onChange={(e) => onChange('propertyType', e.target.value)}
                        className="w-full px-4 py-4 bg-kiosk-card border border-kiosk-border rounded-xl
                                   focus:outline-none focus:ring-2 focus:ring-kiosk-primary text-kiosk-lg capitalize"
                    >
                        {PROPERTY_TYPES.map((type) => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                </div>

                {showLoadRequirement && (
                    <div>
                        <label className="block text-kiosk-sm text-kiosk-muted mb-2">Load Requirement</label>
                        <select
                            value={formData.loadRequirement}
                            onChange={(e) => onChange('loadRequirement', e.target.value)}
                            className="w-full px-4 py-4 bg-kiosk-card border border-kiosk-border rounded-xl
                                       focus:outline-none focus:ring-2 focus:ring-kiosk-primary text-kiosk-lg"
                        >
                            {LOAD_REQUIREMENTS.map((load) => (
                                <option key={load} value={load}>{load}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>
        </div>
    );
}

function BulkWasteStep({
    formData,
    onChange,
}: {
    formData: FormData;
    onChange: (field: keyof FormData, value: string) => void;
}) {
    return (
        <div className="space-y-6">
            <h2 className="text-kiosk-2xl font-semibold text-center mb-8">
                Bulk Waste Details
            </h2>
            <div className="space-y-4">
                <div>
                    <label className="block text-kiosk-sm text-kiosk-muted mb-2">Pickup Date *</label>
                    <input
                        type="date"
                        value={formData.pickupDate}
                        onChange={(e) => onChange('pickupDate', e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-4 bg-kiosk-card border border-kiosk-border rounded-xl
                                   focus:outline-none focus:ring-2 focus:ring-kiosk-primary text-kiosk-lg"
                    />
                </div>
                <div>
                    <label className="block text-kiosk-sm text-kiosk-muted mb-2">Waste Type *</label>
                    <select
                        value={formData.wasteType}
                        onChange={(e) => onChange('wasteType', e.target.value)}
                        className="w-full px-4 py-4 bg-kiosk-card border border-kiosk-border rounded-xl
                                   focus:outline-none focus:ring-2 focus:ring-kiosk-primary text-kiosk-lg capitalize"
                    >
                        {WASTE_TYPES.map((type) => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-kiosk-sm text-kiosk-muted mb-2">Pickup Address *</label>
                    <div className="relative">
                        <MapPin className="absolute left-4 top-4 w-5 h-5 text-kiosk-muted" />
                        <textarea
                            value={formData.currentAddress}
                            onChange={(e) => onChange('currentAddress', e.target.value)}
                            placeholder="Enter pickup location"
                            rows={3}
                            className="w-full pl-12 pr-4 py-4 bg-kiosk-card border border-kiosk-border rounded-xl
                                       focus:outline-none focus:ring-2 focus:ring-kiosk-primary text-kiosk-base resize-none"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

function ReviewStep({ formData }: { formData: FormData }) {
    const requestType = REQUEST_TYPES.find((t) => t.id === formData.requestType);
    const utilityType = UTILITY_TYPES.find((t) => t.id === formData.utilityType);

    return (
        <div className="space-y-6">
            <h2 className="text-kiosk-2xl font-semibold text-center mb-8">
                Review Your Request
            </h2>
            <div className="bg-kiosk-card rounded-2xl p-6 space-y-4">
                <div className="flex justify-between border-b border-kiosk-border pb-3">
                    <span className="text-kiosk-muted">Request Type</span>
                    <span className="font-medium">{requestType?.label}</span>
                </div>
                <div className="flex justify-between border-b border-kiosk-border pb-3">
                    <span className="text-kiosk-muted">Utility</span>
                    <span className="font-medium">{utilityType?.label}</span>
                </div>
                <div className="flex justify-between border-b border-kiosk-border pb-3">
                    <span className="text-kiosk-muted">Name</span>
                    <span className="font-medium">{formData.fullName}</span>
                </div>
                <div className="flex justify-between border-b border-kiosk-border pb-3">
                    <span className="text-kiosk-muted">Phone</span>
                    <span className="font-medium">{formData.phoneNumber}</span>
                </div>
                {formData.requestType === 'BULK_WASTE' ? (
                    <>
                        <div className="flex justify-between border-b border-kiosk-border pb-3">
                            <span className="text-kiosk-muted">Pickup Date</span>
                            <span className="font-medium">{formData.pickupDate}</span>
                        </div>
                        <div className="flex justify-between border-b border-kiosk-border pb-3">
                            <span className="text-kiosk-muted">Waste Type</span>
                            <span className="font-medium capitalize">{formData.wasteType}</span>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="flex justify-between border-b border-kiosk-border pb-3">
                            <span className="text-kiosk-muted">Address</span>
                            <span className="font-medium text-right max-w-[60%]">{formData.currentAddress}</span>
                        </div>
                        {formData.newAddress && (
                            <div className="flex justify-between border-b border-kiosk-border pb-3">
                                <span className="text-kiosk-muted">New Address</span>
                                <span className="font-medium text-right max-w-[60%]">{formData.newAddress}</span>
                            </div>
                        )}
                    </>
                )}
            </div>
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-kiosk-sm text-amber-200">
                    By submitting, you confirm the details are correct. Processing time is 3-5 business days.
                </p>
            </div>
        </div>
    );
}

function SuccessStep({ requestNumber }: { requestNumber: string }) {
    const navigate = useNavigate();

    return (
        <div className="text-center space-y-6 py-8">
            <div className="w-20 h-20 mx-auto bg-green-500/20 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-green-400" />
            </div>
            <h2 className="text-kiosk-2xl font-semibold">Request Submitted!</h2>
            <p className="text-kiosk-muted">Your service request has been registered successfully.</p>
            <div className="bg-kiosk-card rounded-xl p-6 inline-block">
                <p className="text-kiosk-sm text-kiosk-muted mb-1">Request Number</p>
                <p className="text-kiosk-2xl font-bold text-kiosk-primary">{requestNumber}</p>
            </div>
            <p className="text-kiosk-sm text-kiosk-muted">
                Keep this number safe for tracking your request status.
            </p>
            <button
                onClick={() => navigate('/dashboard')}
                className="w-full py-4 bg-kiosk-primary hover:bg-kiosk-primary/80 rounded-xl
                           font-medium text-kiosk-lg transition-colors"
            >
                Back to Dashboard
            </button>
        </div>
    );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function ServiceRequestPage() {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [formData, setFormData] = useState<FormData>(initialFormData);
    const [step, setStep] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [requestNumber, setRequestNumber] = useState<string | null>(null);

    const handleChange = (field: keyof FormData, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        setError(null);
    };

    // Determine steps based on request type
    const getSteps = () => {
        if (formData.requestType === 'BULK_WASTE') {
            return ['type', 'utility', 'personal', 'waste', 'review'];
        }
        return ['type', 'utility', 'personal', 'address', 'review'];
    };

    const steps = getSteps();
    const totalSteps = steps.length;

    const canProceed = () => {
        switch (steps[step]) {
            case 'type':
                return formData.requestType !== null;
            case 'utility':
                return formData.utilityType !== null;
            case 'personal':
                return formData.fullName.trim() && formData.phoneNumber.trim().length >= 10;
            case 'address':
                if (formData.requestType === 'ADDRESS_CHANGE') {
                    return formData.currentAddress.trim() && formData.newAddress.trim();
                }
                return formData.currentAddress.trim();
            case 'waste':
                return formData.pickupDate && formData.currentAddress.trim();
            case 'review':
                return true;
            default:
                return false;
        }
    };

    const handleNext = async () => {
        if (step === totalSteps - 1) {
            // Submit form
            setIsSubmitting(true);
            setError(null);
            const result = await submitRequest(formData);
            setIsSubmitting(false);

            if (result.success) {
                setRequestNumber(result.requestNumber || 'SRQ-PENDING');
            } else {
                setError(result.error || 'Submission failed');
            }
        } else {
            setStep((s) => s + 1);
        }
    };

    const handleBack = () => {
        if (step === 0) {
            navigate('/dashboard');
        } else {
            setStep((s) => s - 1);
        }
    };

    // Show success screen
    if (requestNumber) {
        return (
            <div className="min-h-screen bg-kiosk-bg p-6 pb-20">
                <div className="max-w-md mx-auto">
                    <SuccessStep requestNumber={requestNumber} />
                </div>
            </div>
        );
    }

    const renderStep = () => {
        switch (steps[step]) {
            case 'type':
                return (
                    <RequestTypeStep
                        selected={formData.requestType}
                        onSelect={(type) => handleChange('requestType', type)}
                    />
                );
            case 'utility':
                return (
                    <UtilityTypeStep
                        selected={formData.utilityType}
                        onSelect={(type) => handleChange('utilityType', type)}
                        requestType={formData.requestType!}
                    />
                );
            case 'personal':
                return <PersonalDetailsStep formData={formData} onChange={handleChange} />;
            case 'address':
                return (
                    <AddressStep
                        formData={formData}
                        onChange={handleChange}
                        requestType={formData.requestType!}
                    />
                );
            case 'waste':
                return <BulkWasteStep formData={formData} onChange={handleChange} />;
            case 'review':
                return <ReviewStep formData={formData} />;
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-kiosk-bg p-6 pb-20">
            <div className="max-w-md mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={handleBack}
                        className="p-3 hover:bg-kiosk-card rounded-xl transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-kiosk-xl font-semibold">Service Request</h1>
                    <div className="w-12" /> {/* Spacer */}
                </div>

                {/* Progress */}
                <StepIndicator currentStep={step} totalSteps={totalSteps} />

                {/* Step Content */}
                <div className="mb-8">
                    {renderStep()}
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-400" />
                        <p className="text-red-300">{error}</p>
                    </div>
                )}

                {/* Navigation */}
                <button
                    onClick={handleNext}
                    disabled={!canProceed() || isSubmitting}
                    className="w-full py-4 bg-kiosk-primary hover:bg-kiosk-primary/80 disabled:opacity-50
                               disabled:cursor-not-allowed rounded-xl font-medium text-kiosk-lg
                               transition-colors flex items-center justify-center gap-2"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Submitting...
                        </>
                    ) : step === totalSteps - 1 ? (
                        <>
                            <Check className="w-5 h-5" />
                            Submit Request
                        </>
                    ) : (
                        <>
                            Continue
                            <ArrowRight className="w-5 h-5" />
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
