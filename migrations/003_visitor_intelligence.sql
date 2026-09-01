-- ============================================================
-- OORJA — Visitor Intelligence Migration
-- Adds GPS tracking, ISP info, and event logging
-- ============================================================

-- Add new columns to existing visitors table
ALTER TABLE visitors ADD COLUMN IF NOT EXISTS latitude NUMERIC;
ALTER TABLE visitors ADD COLUMN IF NOT EXISTS longitude NUMERIC;
ALTER TABLE visitors ADD COLUMN IF NOT EXISTS isp TEXT;

-- ============================================================
-- TABLE: visitor_events
-- Tracks granular clicks, form submissions, and interactions
-- ============================================================
CREATE TABLE IF NOT EXISTS visitor_events (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    visitor_id      TEXT NOT NULL,
    session_id      TEXT NOT NULL,
    event_type      TEXT NOT NULL,
    element_text    TEXT,
    element_id      TEXT,
    page            TEXT,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_visitor_events_visitor_id ON visitor_events(visitor_id);
CREATE INDEX IF NOT EXISTS idx_visitor_events_session_id ON visitor_events(session_id);
CREATE INDEX IF NOT EXISTS idx_visitor_events_created_at ON visitor_events(created_at DESC);

-- Enable RLS for visitor_events
ALTER TABLE visitor_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for visitor_events" ON visitor_events FOR ALL TO anon USING (true) WITH CHECK (true);

SELECT 'Visitor intelligence migration applied successfully!' AS status;
