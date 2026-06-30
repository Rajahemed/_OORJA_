-- V3 Migrations for Road Warrior EV: Lead Capture & Progressive Form Save

ALTER TABLE riders ADD COLUMN IF NOT EXISTS "current_step" INTEGER DEFAULT 1;
ALTER TABLE riders ADD COLUMN IF NOT EXISTS "progress_percentage" INTEGER DEFAULT 0;
ALTER TABLE riders ADD COLUMN IF NOT EXISTS "form_status" TEXT DEFAULT 'Lead'; -- 'Lead', 'Partial', 'Completed'
ALTER TABLE riders ADD COLUMN IF NOT EXISTS "is_completed" BOOLEAN DEFAULT false;
ALTER TABLE riders ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create trigger for auto-updating updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_riders_updated_at ON riders;
CREATE TRIGGER update_riders_updated_at
BEFORE UPDATE ON riders
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
