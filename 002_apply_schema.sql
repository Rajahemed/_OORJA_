-- Migration script to update the 'riders' table schema for the new registration form

-- Section 1 & 2: Vehicle & Work Information
ALTER TABLE riders 
ADD COLUMN IF NOT EXISTS "vehicleOwnership" TEXT,
ADD COLUMN IF NOT EXISTS "weeklyRent" NUMERIC,
ADD COLUMN IF NOT EXISTS "monthlyRent" NUMERIC,
ADD COLUMN IF NOT EXISTS "workingHours" TEXT,
ADD COLUMN IF NOT EXISTS "kmPerDay" NUMERIC,
ADD COLUMN IF NOT EXISTS "netSalary" TEXT,
ADD COLUMN IF NOT EXISTS "variablePay" TEXT,
ADD COLUMN IF NOT EXISTS "kmPerMonth" NUMERIC;

-- Section 3: Fuel Information
ALTER TABLE riders 
ADD COLUMN IF NOT EXISTS "fuelType" TEXT;
-- Note: "fuelExpenseWeekly" already exists. "fuelMethod" already exists.

-- Section 4: Maintenance Information
ALTER TABLE riders
ADD COLUMN IF NOT EXISTS "maintenanceTyre" TEXT,
ADD COLUMN IF NOT EXISTS "maintenanceOil" TEXT,
ADD COLUMN IF NOT EXISTS "maintenanceService" TEXT;
-- Note: "maintenanceExpenseMonthly" already exists.

-- Section 5: Rider Challenges
ALTER TABLE riders
ADD COLUMN IF NOT EXISTS "fuelCostChallenge" TEXT;
-- Note: 'challenges', 'evChallenges', 'petrolChallenges' JSONB already exist

-- Section 6: Safety & Wellbeing
ALTER TABLE riders
ADD COLUMN IF NOT EXISTS "helmetUsage" TEXT,
ADD COLUMN IF NOT EXISTS "trainingReceived" TEXT;

-- Section 7: Workplace Facilities
ALTER TABLE riders
ADD COLUMN IF NOT EXISTS "workplaceFacilities" TEXT;

-- Section 8: Insurance
ALTER TABLE riders
ADD COLUMN IF NOT EXISTS "vehicleInsurance" TEXT,
ADD COLUMN IF NOT EXISTS "insuranceExpiry" DATE;
