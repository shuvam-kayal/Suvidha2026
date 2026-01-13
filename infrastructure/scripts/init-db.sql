-- PostgreSQL Initialization Script for SUVIDHA 2026
-- This script runs on first container startup

-- Create schemas for each service (loose coupling)
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS billing;
CREATE SCHEMA IF NOT EXISTS grievance;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- AUTH SCHEMA
-- =============================================================================

CREATE TABLE IF NOT EXISTS auth.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number VARCHAR(15) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    aadhaar_hash VARCHAR(64), -- Hashed for DPDP compliance
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS auth.sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    refresh_token_hash VARCHAR(64) NOT NULL,
    device_info JSONB,
    ip_address INET,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_user_id ON auth.sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON auth.sessions(expires_at);

-- =============================================================================
-- BILLING SCHEMA
-- =============================================================================

CREATE TABLE IF NOT EXISTS billing.utility_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    utility_type VARCHAR(20) NOT NULL CHECK (utility_type IN ('ELECTRICITY', 'GAS', 'WATER')),
    account_number VARCHAR(50) NOT NULL,
    connection_address TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(utility_type, account_number)
);

CREATE TABLE IF NOT EXISTS billing.bills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES billing.utility_accounts(id),
    bill_number VARCHAR(50) UNIQUE NOT NULL,
    bill_date DATE NOT NULL,
    due_date DATE NOT NULL,
    amount_due DECIMAL(10,2) NOT NULL,
    amount_paid DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'OVERDUE', 'PARTIALLY_PAID')),
    bill_details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS billing.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bill_id UUID NOT NULL REFERENCES billing.bills(id),
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    transaction_id VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'SUCCESS' CHECK (status IN ('SUCCESS', 'FAILED', 'PENDING', 'REFUNDED')),
    payment_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    receipt_data JSONB
);

CREATE INDEX idx_bills_account_id ON billing.bills(account_id);
CREATE INDEX idx_bills_status ON billing.bills(status);
CREATE INDEX idx_payments_bill_id ON billing.payments(bill_id);

-- =============================================================================
-- GRIEVANCE SCHEMA
-- =============================================================================

CREATE TABLE IF NOT EXISTS grievance.complaints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_number VARCHAR(20) UNIQUE NOT NULL,
    user_id UUID NOT NULL,
    utility_type VARCHAR(20) NOT NULL CHECK (utility_type IN ('ELECTRICITY', 'GAS', 'WATER', 'MUNICIPAL')),
    category VARCHAR(50) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'ESCALATED')),
    priority VARCHAR(10) NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
    assigned_to UUID,
    resolution_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS grievance.complaint_updates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id UUID NOT NULL REFERENCES grievance.complaints(id) ON DELETE CASCADE,
    update_type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_complaints_user_id ON grievance.complaints(user_id);
CREATE INDEX idx_complaints_status ON grievance.complaints(status);
CREATE INDEX idx_complaints_ticket ON grievance.complaints(ticket_number);
CREATE INDEX idx_complaint_updates_complaint_id ON grievance.complaint_updates(complaint_id);

-- =============================================================================
-- AUDIT LOG (Security Compliance)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    user_id UUID,
    ip_address INET,
    user_agent TEXT,
    event_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_log_event_type ON public.audit_log(event_type);
CREATE INDEX idx_audit_log_user_id ON public.audit_log(user_id);
CREATE INDEX idx_audit_log_created_at ON public.audit_log(created_at);

-- Grant permissions
GRANT USAGE ON SCHEMA auth TO suvidha;
GRANT USAGE ON SCHEMA billing TO suvidha;
GRANT USAGE ON SCHEMA grievance TO suvidha;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA auth TO suvidha;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA billing TO suvidha;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA grievance TO suvidha;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO suvidha;
