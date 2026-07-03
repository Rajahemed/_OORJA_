-- Migration script to update the 'riders' table schema for the new registration form

-- Section 1 & 2: Vehicle & Work Information
ALTER TABLE riders 
ADD COLUMN IF NOT EXISTS "vehicleOwnership" TEXT,
ADD COLUMN IF NOT EXISTS "weeklyRent" NUMERIC,
ADD COLUMN IF NOT EXISTS "monthlyRent" NUMERIC,
ADD COLUMN IF NOT EXISTS "workingHours" TEXT,
ADD COLUMN IF NOT EXISTS "kmPerDay" NUMERIC,
ADD COLUMN IF NOT EXISTS "kmPerMonth" NUMERIC;

-- Section 3: Fuel Information
ALTER TABLE riders 
ADD COLUMN IF NOT EXISTS "fuelType" TEXT;
-- Note: "fuelExpenseWeekly" already exists. "fuelMethod" already exists.

-- Section 4: Maintenance Information
ALTER TABLE riders
ADD COLUMN IF NOT EXISTS "maintenanceTyre" TEXT,
ADD COLUMN IF NOT EXISTS "maintenanceEngineOil" TEXT,
ADD COLUMN IF NOT EXISTS "maintenanceServicing" TEXT;
-- Note: "maintenanceExpenseMonthly" already exists.

-- Section 5: Rider Challenges
ALTER TABLE riders
ADD COLUMN IF NOT EXISTS "fuelCostChallenge" TEXT;
-- Note: 'challenges', 'evChallenges', 'petrolChallenges' JSONB already exist

-- Section 6: Safety & Wellbeing
ALTER TABLE riders
ADD COLUMN IF NOT EXISTS "helmetUsage" TEXT,
ADD COLUMN IF NOT EXISTS "trainingCustomer" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "trainingAccident" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "trainingBreakdown" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "trainingEmergency" BOOLEAN DEFAULT false;

-- Section 7: Workplace Facilities
ALTER TABLE riders
ADD COLUMN IF NOT EXISTS "facilitySeating" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "facilityWater" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "facilityToilet" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "facilityRest" BOOLEAN DEFAULT false;

-- Section 8: Insurance
ALTER TABLE riders
ADD COLUMN IF NOT EXISTS "vehicleInsurance" TEXT,
ADD COLUMN IF NOT EXISTS "insuranceExpiry" DATE;
