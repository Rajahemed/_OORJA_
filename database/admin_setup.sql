-- Drop existing table if we are changing the schema from phone to email
DROP TABLE IF EXISTS public.admin_users CASCADE;

-- Create the admin_users table to ensure only one admin can be registered
CREATE TABLE IF NOT EXISTS public.admin_users (
  id uuid REFERENCES auth.users(id) PRIMARY KEY,
  email text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Allow read access to anyone (so the server can check if an admin exists)
CREATE POLICY "Allow public read access to admin_users"
  ON public.admin_users
  FOR SELECT
  USING (true);

-- Allow insert access only if the table is empty
CREATE POLICY "Allow insert if no admin exists"
  ON public.admin_users
  FOR INSERT
  WITH CHECK (
    NOT EXISTS (SELECT 1 FROM public.admin_users)
  );
