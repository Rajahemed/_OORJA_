-- Add GPS columns to the riders table
ALTER TABLE public.riders
ADD COLUMN latitude DOUBLE PRECISION,
ADD COLUMN longitude DOUBLE PRECISION,
ADD COLUMN location_accuracy DOUBLE PRECISION;
