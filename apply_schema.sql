-- Road Warrior EV - Full Schema Reset
-- Run this in the Supabase SQL Editor at: https://app.supabase.com

-- Step 1: Drop existing tables (in correct order to avoid FK constraint errors)
DROP TABLE IF EXISTS "whatsappLogs" CASCADE;
DROP TABLE IF EXISTS "auditReports" CASCADE;
DROP TABLE IF EXISTS deliveries CASCADE;
DROP TABLE IF EXISTS vehicles CASCADE;
DROP TABLE IF EXISTS riders CASCADE;

-- Step 2: Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 3: Create the correct Riders Table
CREATE TABLE riders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "fullName" TEXT NOT NULL,
    email TEXT UNIQUE,
    password TEXT,
    phone TEXT UNIQUE NOT NULL,
    state TEXT,
    city TEXT,
    pincode TEXT,
    "deliveryPlatform" TEXT,
    "experienceYears" TEXT,
    "isActive" BOOLEAN DEFAULT true,
    "totalPoints" INTEGER DEFAULT 10,
    "totalDeliveries" INTEGER DEFAULT 0,
    rating NUMERIC DEFAULT 5.0,
    "joinedDate" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "lastActive" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "referralCode" TEXT UNIQUE,
    referrals INTEGER DEFAULT 0,
    "vehicleType" TEXT,
    "vehicleModel" TEXT,
    "fuelMethod" TEXT,
    "fuelExpenseWeekly" NUMERIC DEFAULT 0,
    "maintenanceExpenseMonthly" NUMERIC DEFAULT 0,
    challenges JSONB DEFAULT '[]'::jsonb,
    "evChallenges" JSONB DEFAULT '[]'::jsonb,
    "petrolChallenges" JSONB DEFAULT '[]'::jsonb,
    "hasAccidentalInsurance" TEXT,
    "hasHealthInsurance" TEXT,
    "paidOutofPocketAccident" TEXT,
    "openToEV" TEXT,
    "switchTriggers" JSONB DEFAULT '[]'::jsonb,
    interests TEXT,
    "referredByCode" TEXT,
    tags JSONB DEFAULT '[]'::jsonb,
    language TEXT DEFAULT 'en',
    "registeredAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "profileImage" TEXT,
    milestone10 BOOLEAN DEFAULT false,
    milestone25 BOOLEAN DEFAULT false,
    milestone50 BOOLEAN DEFAULT false,
    "consentPrivacy" BOOLEAN DEFAULT false,
    "consentMarketing" BOOLEAN DEFAULT false,
    "consentTerms" BOOLEAN DEFAULT false
);

-- Step 4: Create the Vehicles Table
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "riderId" UUID REFERENCES riders(id) ON DELETE CASCADE,
    "vehicleType" TEXT,
    "licensePlate" TEXT,
    color TEXT,
    make TEXT,
    model TEXT,
    "registrationDate" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'active',
    mileage NUMERIC DEFAULT 0,
    "fuelType" TEXT DEFAULT 'petrol',
    insurance JSONB DEFAULT '{"provider": "", "expiryDate": null, "policyNumber": ""}'::jsonb
);

-- Step 5: Create the Deliveries Table
CREATE TABLE deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "riderId" UUID REFERENCES riders(id) ON DELETE CASCADE,
    "pickupLocation" TEXT,
    "dropoffLocation" TEXT,
    "deliveryType" TEXT DEFAULT 'food',
    amount NUMERIC DEFAULT 50,
    status TEXT DEFAULT 'pending',
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "startTime" TIMESTAMP WITH TIME ZONE,
    "endTime" TIMESTAMP WITH TIME ZONE,
    distance NUMERIC DEFAULT 0,
    duration NUMERIC DEFAULT 0,
    rating NUMERIC
);

-- Step 6: Create the Audit Reports Table
CREATE TABLE "auditReports" (
    id UUID PRIMARY KEY,
    url TEXT,
    "overallScore" INTEGER,
    scores JSONB,
    checks JSONB,
    recommendations JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 7: Create the WhatsApp Logs Table
CREATE TABLE "whatsappLogs" (
    id UUID PRIMARY KEY,
    "to" TEXT,
    message TEXT,
    "riderId" UUID,
    language TEXT,
    type TEXT,
    provider TEXT,
    status TEXT,
    "sentAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 8: Enable Row Level Security (RLS) - Allow all operations for anon key
ALTER TABLE riders ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE "auditReports" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "whatsappLogs" ENABLE ROW LEVEL SECURITY;

-- Step 9: Create RLS policies to allow all operations (for your anon key)
CREATE POLICY "Allow all for riders" ON riders FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for vehicles" ON vehicles FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for deliveries" ON deliveries FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for auditReports" ON "auditReports" FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for whatsappLogs" ON "whatsappLogs" FOR ALL TO anon USING (true) WITH CHECK (true);

-- Done! Your schema is ready.
SELECT 'Schema applied successfully! Tables: riders, vehicles, deliveries, auditReports, whatsappLogs' as status;
