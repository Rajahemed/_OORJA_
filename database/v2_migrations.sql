-- V2 Migrations for Road Warrior EV

-- Add Consent Fields (Phase 3)
ALTER TABLE riders ADD COLUMN IF NOT EXISTS "consentPrivacy" BOOLEAN DEFAULT false;
ALTER TABLE riders ADD COLUMN IF NOT EXISTS "consentMarketing" BOOLEAN DEFAULT false;
ALTER TABLE riders ADD COLUMN IF NOT EXISTS "consentTerms" BOOLEAN DEFAULT false;

-- Add Role for Admin Authentication (Phase 10)
ALTER TABLE riders ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'RIDER';

-- (Optional) Create a default admin user if needed manually
-- INSERT INTO riders ("fullName", phone, password, role) VALUES ('Admin', '0000000000', 'admin_hash_here', 'SUPER_ADMIN');
