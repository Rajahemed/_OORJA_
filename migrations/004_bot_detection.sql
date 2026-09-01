-- ============================================================
-- OORJA — Bot Detection & Advanced Analytics
-- Adds user_agent, asn, org, bot detection, and datacenter tracking
-- ============================================================

-- Add new columns to existing visitors table
ALTER TABLE visitors ADD COLUMN IF NOT EXISTS user_agent TEXT;
ALTER TABLE visitors ADD COLUMN IF NOT EXISTS asn TEXT;
ALTER TABLE visitors ADD COLUMN IF NOT EXISTS organization TEXT;
ALTER TABLE visitors ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE visitors ADD COLUMN IF NOT EXISTS is_bot BOOLEAN DEFAULT false;
ALTER TABLE visitors ADD COLUMN IF NOT EXISTS bot_name TEXT;
ALTER TABLE visitors ADD COLUMN IF NOT EXISTS bot_category TEXT;
ALTER TABLE visitors ADD COLUMN IF NOT EXISTS is_datacenter BOOLEAN DEFAULT false;

-- Create indexes for performance on the new dashboard queries
CREATE INDEX IF NOT EXISTS idx_visitors_is_bot ON visitors(is_bot);
CREATE INDEX IF NOT EXISTS idx_visitors_is_datacenter ON visitors(is_datacenter);

SELECT 'Bot detection columns added successfully!' AS status;
