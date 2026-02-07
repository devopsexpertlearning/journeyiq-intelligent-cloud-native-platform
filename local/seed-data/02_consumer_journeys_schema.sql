-- JourneyIQ Database Schema Extensions
-- Migration to support all 110 Consumer Journey scenarios
-- Run this after 01_init_schemas.sql

-- ==========================================
-- AUTH SERVICE EXTENSIONS
-- ==========================================

-- NOTE: user_credentials table is now created in 01_init_schemas.sql
-- No need to create it here if running after fresh init.

-- Service Accounts (Journey 12)
CREATE TABLE IF NOT EXISTS service_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id VARCHAR(100) UNIQUE NOT NULL,
    client_secret_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100),
    role VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Impersonation Audit Log (Journey 87)
CREATE TABLE IF NOT EXISTS impersonation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID,
    target_user_id UUID,
    reason TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE
);

-- ==========================================
-- USER SERVICE EXTENSIONS
-- ==========================================

-- NOTE: The following columns are now created in 01_init_schemas.sql:
-- is_active, updated_at, deactivated_at, deleted_at, avatar_url,
-- consent_marketing, consent_data_sharing, banned_at, ban_reason
-- No ALTER TABLE statements needed if running after fresh init.

-- For existing databases, uncomment these if needed:
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMP WITH TIME ZONE;
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500);
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS consent_marketing BOOLEAN DEFAULT FALSE;
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS consent_data_sharing BOOLEAN DEFAULT FALSE;
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS banned_at TIMESTAMP WITH TIME ZONE;
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS ban_reason TEXT;

-- Organizations (Journey 21)
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team Invitations (Journey 21)
CREATE TABLE IF NOT EXISTS team_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id),
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50),
    token VARCHAR(100) UNIQUE NOT NULL,
    invited_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    accepted_at TIMESTAMP WITH TIME ZONE
);

-- ==========================================
-- NOTIFICATION SERVICE EXTENSIONS
-- ==========================================

-- Webhooks (Journey 15, 81)
CREATE TABLE IF NOT EXISTS webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    url VARCHAR(500) NOT NULL,
    secret VARCHAR(100) NOT NULL,
    events JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Webhook Deliveries (Journey 81)
CREATE TABLE IF NOT EXISTS webhook_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webhook_id UUID REFERENCES webhooks(id),
    event_type VARCHAR(100),
    payload JSONB,
    status VARCHAR(50),
    attempts INT DEFAULT 0,
    delivered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Device Tokens (Journey 83)
CREATE TABLE IF NOT EXISTS device_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    token VARCHAR(500) NOT NULL,
    platform VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE
);

-- Support Tickets (Journey 107)
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    subject VARCHAR(255) NOT NULL,
    description TEXT,
    priority VARCHAR(20),
    status VARCHAR(50) DEFAULT 'open',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Price Alerts (Journey 109)
CREATE TABLE IF NOT EXISTS price_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    flight_id UUID REFERENCES flights(id),
    target_price DECIMAL(10, 2),
    is_active BOOLEAN DEFAULT TRUE,
    triggered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- BOOKING SERVICE EXTENSIONS
-- ==========================================

-- Add columns to bookings table
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS pnr VARCHAR(20) UNIQUE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS is_bundle BOOLEAN DEFAULT FALSE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS total_price DECIMAL(10, 2);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS hotel_id UUID;

-- Booking Extras (Journey 104)
CREATE TABLE IF NOT EXISTS booking_extras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES bookings(id),
    extra_type VARCHAR(50),
    description TEXT,
    price DECIMAL(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Passengers (Journey 110)
CREATE TABLE IF NOT EXISTS passengers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES bookings(id),
    passenger_index INT,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    date_of_birth DATE,
    passport_number VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- PAYMENT SERVICE EXTENSIONS
-- ==========================================

-- Promotions (Journey 28)
CREATE TABLE IF NOT EXISTS promotions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    discount_type VARCHAR(20),
    discount_value DECIMAL(10, 2),
    valid_from TIMESTAMP WITH TIME ZONE,
    valid_until TIMESTAMP WITH TIME ZONE,
    max_uses INT,
    current_uses INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

-- Seed sample promotion
INSERT INTO promotions (code, discount_type, discount_value, valid_from, valid_until, max_uses, is_active)
VALUES ('SUMMER2024', 'fixed_amount', 50.00, NOW(), NOW() + INTERVAL '90 days', 1000, TRUE)
ON CONFLICT (code) DO NOTHING;

-- Promotion Usage (Journey 28)
CREATE TABLE IF NOT EXISTS promotion_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promotion_id UUID REFERENCES promotions(id),
    user_id UUID,
    booking_id UUID REFERENCES bookings(id),
    credit_applied DECIMAL(10, 2),
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- EMI Plans (Journey 105)
CREATE TABLE IF NOT EXISTS emi_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES bookings(id),
    total_amount DECIMAL(10, 2),
    months INT,
    monthly_amount DECIMAL(10, 2),
    interest_rate DECIMAL(5, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- EMI Installments (Journey 105)
CREATE TABLE IF NOT EXISTS emi_installments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    emi_plan_id UUID REFERENCES emi_plans(id),
    installment_number INT,
    amount DECIMAL(10, 2),
    due_date DATE,
    paid_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20)
);

-- Invoices (Journey 27)
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID,
    invoice_number VARCHAR(50) UNIQUE,
    pdf_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- SEARCH SERVICE EXTENSIONS
-- ==========================================

-- Holiday Packages (Journey 101)
CREATE TABLE IF NOT EXISTS packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255),
    destination VARCHAR(100),
    duration_days INT,
    price DECIMAL(10, 2),
    includes JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Car Rentals (Journey 102)
CREATE TABLE IF NOT EXISTS cars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location VARCHAR(100),
    type VARCHAR(50),
    model VARCHAR(100),
    price_per_day DECIMAL(10, 2),
    is_available BOOLEAN DEFAULT TRUE
);

-- ==========================================
-- REVIEW SERVICE EXTENSIONS
-- ==========================================

-- Add columns to reviews table
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS reported_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS report_reason VARCHAR(255);
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT FALSE;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(50) DEFAULT 'approved';
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS booking_id UUID;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- ==========================================
-- ANALYTICS SERVICE
-- ==========================================

-- API Usage Logs (Journey 16)
CREATE TABLE IF NOT EXISTS api_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    endpoint VARCHAR(255),
    method VARCHAR(10),
    status_code INT,
    response_time_ms INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Report Jobs (Journey 44)
CREATE TABLE IF NOT EXISTS report_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    report_type VARCHAR(50),
    parameters JSONB,
    status VARCHAR(50),
    download_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- ==========================================
-- TICKETING SERVICE
-- ==========================================

-- Tickets (Journey 45)
CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES bookings(id),
    ticket_number VARCHAR(50) UNIQUE,
    pkpass_url VARCHAR(500),
    barcode VARCHAR(100),
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- IOT SERVICE
-- ==========================================

-- Kiosk Check-ins (Journey 91)
CREATE TABLE IF NOT EXISTS kiosk_checkins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES bookings(id),
    kiosk_id VARCHAR(50),
    boarding_pass_url VARCHAR(500),
    gate VARCHAR(10),
    checked_in_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Biometric Enrollments (Journey 94)
CREATE TABLE IF NOT EXISTS biometric_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    biometric_type VARCHAR(20),
    biometric_hash VARCHAR(255),
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Baggage Tracking (Journey 92)
CREATE TABLE IF NOT EXISTS baggage_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES bookings(id),
    tag_id VARCHAR(50) UNIQUE,
    current_location VARCHAR(100),
    last_scan_lat DECIMAL(10, 6),
    last_scan_lon DECIMAL(10, 6),
    status VARCHAR(50),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- ADMIN SERVICE
-- ==========================================

-- System Configuration (Journey 88)
CREATE TABLE IF NOT EXISTS system_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value JSONB,
    updated_by UUID,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System Metrics (Journey 89)
CREATE TABLE IF NOT EXISTS system_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name VARCHAR(100),
    metric_value DECIMAL(10, 2),
    tags JSONB,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_webhooks_user_id ON webhooks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_pnr ON bookings(pnr);
CREATE INDEX IF NOT EXISTS idx_price_alerts_user_id ON price_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_price_alerts_flight_id ON price_alerts(flight_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_user_id ON api_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_created_at ON api_usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Schema migration completed successfully. All tables for 110 consumer journeys are now available.';
END $$;
