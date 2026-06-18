-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Riders Table
CREATE TABLE IF NOT EXISTS riders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "fullName" TEXT,
    email TEXT UNIQUE,
    password TEXT,
    phone TEXT UNIQUE,
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
    milestone50 BOOLEAN DEFAULT false
);

-- Vehicles Table
CREATE TABLE IF NOT EXISTS vehicles (
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

-- Deliveries Table
CREATE TABLE IF NOT EXISTS deliveries (
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

-- Audit Reports Table
CREATE TABLE IF NOT EXISTS "auditReports" (
    id UUID PRIMARY KEY,
    url TEXT,
    "overallScore" INTEGER,
    scores JSONB,
    checks JSONB,
    recommendations JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- WhatsApp Logs Table
CREATE TABLE IF NOT EXISTS "whatsappLogs" (
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
