-- ============================================================
-- OORJA — Intelligence System Migration
-- Run AFTER apply_schema.sql — does NOT touch existing tables
-- Supabase SQL Editor: https://app.supabase.com
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLE: visitors
-- Anonymous visitor fingerprints — no PII stored
-- ============================================================
CREATE TABLE IF NOT EXISTS visitors (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    visitor_id      TEXT UNIQUE NOT NULL,
    ip_address      TEXT,
    country         TEXT,
    region          TEXT,
    city            TEXT,
    timezone        TEXT,
    language        TEXT,
    browser         TEXT,
    operating_system TEXT,
    device_type     TEXT,
    screen_resolution TEXT,
    referral_source TEXT,
    landing_page    TEXT,
    current_page    TEXT,
    first_visit     TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_visit      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    visit_count     INTEGER DEFAULT 1,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TABLE: sessions
-- One row per page-visit session
-- ============================================================
CREATE TABLE IF NOT EXISTS sessions (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id  TEXT NOT NULL,
    visitor_id  TEXT NOT NULL,
    page        TEXT,
    referrer    TEXT,
    duration    INTEGER DEFAULT 0,
    events      JSONB DEFAULT '[]'::jsonb,
    started_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at    TIMESTAMP WITH TIME ZONE
);

-- ============================================================
-- TABLE: leads
-- Captured from lead form — separate from rider registrations
-- ============================================================
CREATE TABLE IF NOT EXISTS ev_leads (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name           TEXT,
    email               TEXT,
    phone               TEXT,
    company             TEXT,
    message             TEXT,
    source              TEXT DEFAULT 'website',
    visitor_id          TEXT,
    consent_marketing   BOOLEAN DEFAULT false,
    unsubscribed        BOOLEAN DEFAULT false,
    unsubscribed_at     TIMESTAMP WITH TIME ZONE,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TABLE: email_campaigns
-- Campaign definitions for the drip sequence
-- ============================================================
CREATE TABLE IF NOT EXISTS email_campaigns (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        TEXT NOT NULL UNIQUE,
    subject     TEXT,
    template    TEXT,
    delay_days  INTEGER DEFAULT 0,
    active      BOOLEAN DEFAULT true,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TABLE: email_logs
-- Per-send audit log with retry tracking
-- ============================================================
CREATE TABLE IF NOT EXISTS email_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id         UUID REFERENCES leads(id) ON DELETE CASCADE,
    campaign_id     UUID REFERENCES email_campaigns(id) ON DELETE SET NULL,
    to_email        TEXT NOT NULL,
    subject         TEXT,
    status          TEXT DEFAULT 'pending',  -- pending | sent | failed | skipped
    attempts        INTEGER DEFAULT 0,
    max_attempts    INTEGER DEFAULT 3,
    scheduled_at    TIMESTAMP WITH TIME ZONE,
    sent_at         TIMESTAMP WITH TIME ZONE,
    error_message   TEXT,
    resend_id       TEXT,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_visitors_visitor_id  ON visitors(visitor_id);
CREATE INDEX IF NOT EXISTS idx_visitors_created_at  ON visitors(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_visitors_device_type ON visitors(device_type);
CREATE INDEX IF NOT EXISTS idx_visitors_browser      ON visitors(browser);

CREATE INDEX IF NOT EXISTS idx_sessions_visitor_id  ON sessions(visitor_id);
CREATE INDEX IF NOT EXISTS idx_sessions_session_id  ON sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_sessions_started_at  ON sessions(started_at DESC);

CREATE INDEX IF NOT EXISTS idx_leads_email          ON ev_leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_created_at     ON ev_leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_unsubscribed   ON ev_leads(unsubscribed);

CREATE INDEX IF NOT EXISTS idx_email_logs_lead_id       ON email_logs(lead_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_status         ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_scheduled_at  ON email_logs(scheduled_at);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE visitors         ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE ev_leads            ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaigns  ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs       ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for visitors"        ON visitors        FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for sessions"        ON sessions        FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for leads"           ON ev_leads           FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for email_campaigns" ON email_campaigns FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for email_logs"      ON email_logs      FOR ALL TO anon USING (true) WITH CHECK (true);

-- ============================================================
-- SEED: Email Campaign Definitions
-- ============================================================
INSERT INTO email_campaigns (name, subject, template, delay_days, active) VALUES
  ('welcome',        'Welcome to OORJA! 🚗⚡',                'welcome',  0,  true),
  ('followup_day7',  'How are you progressing? Your EV journey awaits 🏍️', 'followup', 7,  true),
  ('reminder_day15', 'Still interested? Exclusive EV offers inside 🎁',    'reminder', 15, true)
ON CONFLICT (name) DO NOTHING;

SELECT 'Intelligence system migration applied successfully!' AS status;
