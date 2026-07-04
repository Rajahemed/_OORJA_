-- Migration script for new dynamic Vehicle Ownership and Maintenance fields

ALTER TABLE riders 
ADD COLUMN IF NOT EXISTS "maintPayServicing" TEXT,
ADD COLUMN IF NOT EXISTS "maintPayPuncture" TEXT,
ADD COLUMN IF NOT EXISTS "maintPayWear" TEXT,
ADD COLUMN IF NOT EXISTS "maintPayAccident" TEXT,
ADD COLUMN IF NOT EXISTS "maintInsured" TEXT,
ADD COLUMN IF NOT EXISTS "maintServiceFreq" TEXT,

ADD COLUMN IF NOT EXISTS "rentServiceHistory" TEXT,
ADD COLUMN IF NOT EXISTS "rentTyreInspect" TEXT,
ADD COLUMN IF NOT EXISTS "rentBrakeInspect" TEXT,
ADD COLUMN IF NOT EXISTS "rentLightsInspect" TEXT,
ADD COLUMN IF NOT EXISTS "rentDamagePay" TEXT,
ADD COLUMN IF NOT EXISTS "rentAccidentPay" TEXT,
ADD COLUMN IF NOT EXISTS "rentInsuranceIncluded" TEXT,

ADD COLUMN IF NOT EXISTS "companyMaintPay" TEXT,
ADD COLUMN IF NOT EXISTS "companyInsurance" TEXT,
ADD COLUMN IF NOT EXISTS "companyDamagePay" TEXT,
ADD COLUMN IF NOT EXISTS "companyAccidentPay" TEXT;
