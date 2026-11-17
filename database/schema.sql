-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE EXTENSION IF NOT EXISTS intarray;

DO $$
BEGIN
    BEGIN
        CREATE EXTENSION IF NOT EXISTS postgis;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'PostGIS extension not available in environment; using compatibility layer.';
    END;
END $$;

-- Types / Enums
CREATE TYPE verification_type AS ENUM ('PHONE', 'EMAIL', 'PASSWORD_RESET');
CREATE TYPE booking_mode AS ENUM ('FULL_ONLY', 'FULL_AND_HALF');
CREATE TYPE season_status AS ENUM ('PLANNED', 'ACTIVE', 'CLOSED');
CREATE TYPE field_coverage AS ENUM ('FULL', 'HALF_A', 'HALF_B');
CREATE TYPE duration_type AS ENUM ('SINGLE', 'MONTHLY', 'THREE_MONTHS', 'SIX_MONTHS', 'YEARLY');
CREATE TYPE subscription_status AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED');
CREATE TYPE reservation_type AS ENUM ('SINGLE', 'SUBSCRIPTION', 'TEAM');
CREATE TYPE reservation_status AS ENUM ('PENDING_PAYMENT', 'CONFIRMED', 'CANCELLED', 'EXPIRED', 'CHECKED_IN', 'COMPLETED');
CREATE TYPE closure_reason AS ENUM ('maintenance', 'works', 'technical_problem', 'event', 'administrative_decision', 'other');
CREATE TYPE payment_status AS ENUM ('PENDING', 'PROCESSING', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED');

-- Anti-double booking logic
-- Create mapping from coverage to int array for overlap operator &&
CREATE OR REPLACE FUNCTION coverage_to_array(cov field_coverage) RETURNS int[] AS $$
BEGIN
    RETURN CASE cov
        WHEN 'FULL' THEN ARRAY[1, 2]
        WHEN 'HALF_A' THEN ARRAY[1]
        WHEN 'HALF_B' THEN ARRAY[2]
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Tables
CREATE TABLE wilayas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code INT UNIQUE NOT NULL,
    name_fr VARCHAR NOT NULL,
    name_ar VARCHAR NOT NULL,
    name_en VARCHAR NOT NULL
);

CREATE TABLE communes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wilaya_id UUID NOT NULL REFERENCES wilayas(id) ON DELETE RESTRICT,
    name_fr VARCHAR NOT NULL,
    name_ar VARCHAR NOT NULL,
    name_en VARCHAR NOT NULL,
    UNIQUE(wilaya_id, name_fr)
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR UNIQUE,
    email CITEXT UNIQUE,
    password_hash VARCHAR,
    first_name VARCHAR,
    last_name VARCHAR,
    is_active BOOLEAN DEFAULT true,
    phone_verified_at TIMESTAMPTZ,
    email_verified_at TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_contact_check CHECK (phone IS NOT NULL OR email IS NOT NULL)
);

CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR UNIQUE NOT NULL
);

CREATE TABLE user_roles (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR UNIQUE NOT NULL
);

CREATE TABLE role_permissions (
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE verification_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type verification_type NOT NULL,
    code_hash VARCHAR NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    attempts INT DEFAULT 0,
    max_attempts INT DEFAULT 5,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_verification_codes_user_type_created ON verification_codes(user_id, type, created_at);

CREATE TABLE stadiums (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    commune_id UUID NOT NULL REFERENCES communes(id) ON DELETE RESTRICT,
    name_ar VARCHAR NOT NULL,
    name_fr VARCHAR NOT NULL,
    name_en VARCHAR NOT NULL,
    address VARCHAR,
    location geography,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
DO $$
BEGIN
    BEGIN
        CREATE INDEX idx_stadiums_location ON stadiums USING GIST(location);
    EXCEPTION WHEN OTHERS THEN
        CREATE INDEX idx_stadiums_location ON stadiums (((location).x), ((location).y));
    END;
END $$;

CREATE TABLE stadium_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stadium_id UUID NOT NULL REFERENCES stadiums(id) ON DELETE CASCADE,
    file_url VARCHAR NOT NULL,
    mime_type VARCHAR,
    is_primary BOOLEAN DEFAULT false,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stadium_id UUID NOT NULL REFERENCES stadiums(id) ON DELETE CASCADE,
    name_ar VARCHAR,
    name_fr VARCHAR,
    name_en VARCHAR,
    booking_mode booking_mode NOT NULL,
    opens_at TIME,
    closes_at TIME,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE seasons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    starts_on DATE NOT NULL,
    ends_on DATE NOT NULL,
    status season_status NOT NULL DEFAULT 'PLANNED',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE pricing_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    field_id UUID NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
    season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
    coverage field_coverage NOT NULL,
    duration_type duration_type NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    currency VARCHAR DEFAULT 'DZD',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(field_id, season_id, coverage, duration_type)
);

CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    sessions_per_week INT CHECK (sessions_per_week BETWEEN 1 AND 3),
    starts_on DATE NOT NULL,
    ends_on DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT teams_duration_check CHECK (ends_on <= starts_on + INTERVAL '1 year')
);

CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    field_id UUID NOT NULL REFERENCES fields(id) ON DELETE RESTRICT,
    pricing_plan_id UUID NOT NULL REFERENCES pricing_plans(id) ON DELETE RESTRICT,
    coverage field_coverage NOT NULL,
    starts_on DATE NOT NULL,
    ends_on DATE NOT NULL,
    renewal_deadline DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '15 days'),
    status subscription_status NOT NULL DEFAULT 'ACTIVE',
    amount_paid NUMERIC(12,2) NOT NULL,
    currency VARCHAR DEFAULT 'DZD',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_subscriptions_user_status ON subscriptions(user_id, status);
CREATE INDEX idx_subscriptions_field ON subscriptions(field_id);

CREATE TABLE subscription_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    day_of_week INT CHECK (day_of_week BETWEEN 1 AND 7),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL
);

CREATE TABLE reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    field_id UUID NOT NULL REFERENCES fields(id) ON DELETE RESTRICT,
    user_id UUID REFERENCES users(id) ON DELETE RESTRICT,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE RESTRICT,
    team_id UUID REFERENCES teams(id) ON DELETE RESTRICT,
    type reservation_type NOT NULL,
    coverage field_coverage NOT NULL,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    status reservation_status NOT NULL DEFAULT 'PENDING_PAYMENT',
    created_by UUID REFERENCES users(id) ON DELETE RESTRICT,
    checked_in_at TIMESTAMPTZ,
    checked_in_by UUID REFERENCES users(id) ON DELETE RESTRICT,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    EXCLUDE USING gist (
        field_id WITH =,
        tstzrange(starts_at, ends_at) WITH &&,
        coverage_to_array(coverage) WITH &&
    ) WHERE (status IN ('PENDING_PAYMENT', 'CONFIRMED', 'CHECKED_IN'))
);
CREATE INDEX idx_reservations_field_times ON reservations(field_id, starts_at, ends_at);
CREATE INDEX idx_reservations_user_status ON reservations(user_id, status);
CREATE INDEX idx_reservations_subscription ON reservations(subscription_id);
CREATE INDEX idx_reservations_team ON reservations(team_id);

CREATE TABLE tournaments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    description TEXT,
    starts_on DATE NOT NULL,
    ends_on DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tournament_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    field_id UUID NOT NULL REFERENCES fields(id) ON DELETE RESTRICT,
    coverage field_coverage NOT NULL,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE closures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    field_id UUID NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
    reason closure_reason NOT NULL,
    reason_details TEXT,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    created_by UUID REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reservation_id UUID REFERENCES reservations(id) ON DELETE RESTRICT,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE RESTRICT,
    amount NUMERIC(12,2) NOT NULL,
    currency VARCHAR DEFAULT 'DZD',
    status payment_status NOT NULL DEFAULT 'PENDING',
    provider VARCHAR,
    provider_transaction_id VARCHAR,
    pricing_snapshot JSONB,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT payments_ref_check CHECK ((reservation_id IS NOT NULL AND subscription_id IS NULL) OR (reservation_id IS NULL AND subscription_id IS NOT NULL))
);
CREATE INDEX idx_payments_reservation ON payments(reservation_id);
CREATE INDEX idx_payments_subscription ON payments(subscription_id);

CREATE TABLE payment_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    attempt_number INT NOT NULL,
    status payment_status NOT NULL,
    provider_response JSONB,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE idempotency_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    method VARCHAR NOT NULL,
    path VARCHAR NOT NULL,
    status_code INT,
    response_body JSONB,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX idx_idempotency_keys_expires_at ON idempotency_keys(expires_at);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title_ar VARCHAR,
    title_fr VARCHAR,
    title_en VARCHAR,
    body_ar TEXT,
    body_fr TEXT,
    body_en TEXT,
    type VARCHAR,
    entity_type VARCHAR,
    entity_id UUID,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, read_at);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR NOT NULL,
    entity_type VARCHAR NOT NULL,
    entity_id UUID NOT NULL,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_user_created ON audit_logs(user_id, created_at);
