-- ============================================================
-- Road Warrior EV — Migration: Add Missing Columns
-- Run this ONE TIME in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/zjqlkaewliccvgxqlnao/sql/new
-- 
-- Safe to re-run (IF NOT EXISTS prevents duplicate errors)
-- ============================================================

-- These 7 columns are missing from the live Supabase 'riders' table
ALTER TABLE riders ADD COLUMN IF NOT EXISTS "netSalary"          TEXT;
ALTER TABLE riders ADD COLUMN IF NOT EXISTS "variablePay"        TEXT;
ALTER TABLE riders ADD COLUMN IF NOT EXISTS "majorRepairs"       TEXT;
ALTER TABLE riders ADD COLUMN IF NOT EXISTS "majorRepairCost"    TEXT;
ALTER TABLE riders ADD COLUMN IF NOT EXISTS "rentChecks"         TEXT;
ALTER TABLE riders ADD COLUMN IF NOT EXISTS "companyPuncturePay" TEXT;
ALTER TABLE riders ADD COLUMN IF NOT EXISTS "companyWearPay"     TEXT;

SELECT 'Migration complete! All 7 columns added.' AS status;
