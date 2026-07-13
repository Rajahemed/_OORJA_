-- Migration: WhatsApp Conversation State (updated v2)
-- Run this in your Supabase SQL Editor

-- Create table (if not exists from v1)
CREATE TABLE IF NOT EXISTS whatsapp_state (
    phone TEXT PRIMARY KEY,
    current_step INTEGER DEFAULT 1,
    language TEXT DEFAULT 'en',
    collected_data JSONB DEFAULT '{}'::jsonb,
    last_interaction TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns if upgrading from v1
ALTER TABLE whatsapp_state ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_whatsapp_state_phone ON whatsapp_state(phone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_state_last_interaction ON whatsapp_state(last_interaction);

-- Enable Row Level Security (disable public access — only service role can access)
ALTER TABLE whatsapp_state ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY IF NOT EXISTS "service_role_all" 
    ON whatsapp_state 
    FOR ALL 
    TO service_role 
    USING (true);

-- Auto-cleanup: delete sessions older than 48 hours (optional, run via pg_cron or manual)
-- DELETE FROM whatsapp_state WHERE last_interaction < NOW() - INTERVAL '48 hours';
