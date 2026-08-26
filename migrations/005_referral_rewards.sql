-- 005_referral_rewards.sql

-- Referral Rewards Table
-- Stores multi-level parent/child referral chain rewards dynamically distributed on successful registrations.

CREATE TABLE IF NOT EXISTS referral_rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rewarded_rider_id UUID REFERENCES riders(id) ON DELETE CASCADE,
    new_rider_id UUID REFERENCES riders(id) ON DELETE CASCADE,
    level INTEGER NOT NULL,
    points_awarded INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookups by rewarded rider (e.g., for admin dashboard analytics)
CREATE INDEX IF NOT EXISTS idx_referral_rewards_rewarded ON referral_rewards(rewarded_rider_id);

-- Index for fast lookups by level for admin dashboard analytics
CREATE INDEX IF NOT EXISTS idx_referral_rewards_level ON referral_rewards(level);
