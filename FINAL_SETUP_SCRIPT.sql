-- ==============================================================================
-- KaziLink Supermarket Employment Portal — Complete Database & Storage Setup
-- Project URL: https://zeichvwrpxrpzeqyfypj.supabase.co
-- Run this entire script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/zeichvwrpxrpzeqyfypj/sql/new
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create or Update Applications Table
CREATE TABLE IF NOT EXISTS public.applications (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID,
  reference_number     TEXT UNIQUE NOT NULL,
  supermarket          TEXT NOT NULL,
  supermarket_name     TEXT,
  position             TEXT NOT NULL,
  department           TEXT,
  salary               NUMERIC NOT NULL,
  allowance_label      TEXT,
  allowance_value      TEXT,
  full_name            TEXT NOT NULL,
  phone                TEXT NOT NULL,
  email                TEXT NOT NULL,
  id_number            TEXT,
  preferred_branch     TEXT NOT NULL,
  orientation_branch   TEXT NOT NULL,
  orientation_date     DATE NOT NULL,
  availability         TEXT,
  id_front_url         TEXT,
  id_back_url          TEXT,
  cv_url               TEXT,
  payment_status       TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'paid'
  payment_phone        TEXT,
  checkout_request_id  TEXT,
  mpesa_receipt        TEXT,
  status               TEXT DEFAULT 'submitted',
  paid_at              TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure all required columns exist if the table was previously created with fewer columns
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'supermarket_name') THEN
    ALTER TABLE public.applications ADD COLUMN supermarket_name TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'department') THEN
    ALTER TABLE public.applications ADD COLUMN department TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'salary') THEN
    ALTER TABLE public.applications ADD COLUMN salary NUMERIC;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'allowance_label') THEN
    ALTER TABLE public.applications ADD COLUMN allowance_label TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'allowance_value') THEN
    ALTER TABLE public.applications ADD COLUMN allowance_value TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'id_number') THEN
    ALTER TABLE public.applications ADD COLUMN id_number TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'availability') THEN
    ALTER TABLE public.applications ADD COLUMN availability TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'id_front_url') THEN
    ALTER TABLE public.applications ADD COLUMN id_front_url TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'id_back_url') THEN
    ALTER TABLE public.applications ADD COLUMN id_back_url TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'cv_url') THEN
    ALTER TABLE public.applications ADD COLUMN cv_url TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'checkout_request_id') THEN
    ALTER TABLE public.applications ADD COLUMN checkout_request_id TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'status') THEN
    ALTER TABLE public.applications ADD COLUMN status TEXT DEFAULT 'submitted';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'paid_at') THEN
    ALTER TABLE public.applications ADD COLUMN paid_at TIMESTAMPTZ;
  END IF;
END $$;

-- 3. CRITICAL: Grant Table Permissions (Fixes 42501 permission denied)
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO postgres, anon, authenticated, service_role;

-- 4. Row Level Security Policies
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DROP POLICY IF EXISTS "Public and authenticated can select applications" ON public.applications;
DROP POLICY IF EXISTS "Public and authenticated can insert applications" ON public.applications;
DROP POLICY IF EXISTS "Public and authenticated can update applications" ON public.applications;
DROP POLICY IF EXISTS "Service role has full access to applications" ON public.applications;

-- Allow reading applications (for candidate letter lookup and admin console)
CREATE POLICY "Public and authenticated can select applications"
  ON public.applications FOR SELECT
  TO public, anon, authenticated
  USING (true);

-- Allow inserting applications (for candidate registration even before payment)
CREATE POLICY "Public and authenticated can insert applications"
  ON public.applications FOR INSERT
  TO public, anon, authenticated
  WITH CHECK (true);

-- Allow updating applications (for marking M-Pesa payments paid)
CREATE POLICY "Public and authenticated can update applications"
  ON public.applications FOR UPDATE
  TO public, anon, authenticated
  USING (true)
  WITH CHECK (true);

-- 5. Storage Bucket Configuration (job-applications)
INSERT INTO storage.buckets (id, name, public)
VALUES ('job-applications', 'job-applications', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage object policies
DROP POLICY IF EXISTS "Public read access to job-applications" ON storage.objects;
DROP POLICY IF EXISTS "Public insert access to job-applications" ON storage.objects;
DROP POLICY IF EXISTS "Public update access to job-applications" ON storage.objects;
DROP POLICY IF EXISTS "Public delete access to job-applications" ON storage.objects;

CREATE POLICY "Public read access to job-applications"
  ON storage.objects FOR SELECT
  TO public, anon, authenticated
  USING (bucket_id = 'job-applications');

CREATE POLICY "Public insert access to job-applications"
  ON storage.objects FOR INSERT
  TO public, anon, authenticated
  WITH CHECK (bucket_id = 'job-applications');

CREATE POLICY "Public update access to job-applications"
  ON storage.objects FOR UPDATE
  TO public, anon, authenticated
  USING (bucket_id = 'job-applications');

-- 6. Insert Verified Seed Applications
INSERT INTO public.applications (
  reference_number,
  supermarket,
  supermarket_name,
  position,
  department,
  salary,
  allowance_label,
  allowance_value,
  full_name,
  phone,
  email,
  id_number,
  preferred_branch,
  orientation_branch,
  orientation_date,
  availability,
  payment_status,
  payment_phone,
  mpesa_receipt,
  paid_at,
  created_at
) VALUES 
  (
    'CRF-2026-8812',
    'carrefour',
    'Carrefour Supermarket',
    'Drivers',
    'Logistics',
    45000,
    'Fuel Allowance',
    'KSh 8,000',
    'Brian Otieno Onyango',
    '0712 345 678',
    'brian.otieno@example.com',
    '32984102',
    'Two Rivers',
    'Two Rivers',
    '2026-10-19',
    'Available immediately for full orientation',
    'paid',
    '0712345678',
    'QGH7X2M9P1',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day'
  ),
  (
    'QRT-2026-4409',
    'quickmart',
    'Quickmart Supermarket',
    'Cashiers',
    'Customer Service',
    34000,
    'Medical Allowance',
    'KSh 3,000',
    'Faith Wanjiru Mwangi',
    '0722 888 410',
    'faith.wanjiru@example.com',
    '34819022',
    'Sarit Centre',
    'Sarit Centre',
    '2026-10-26',
    'Morning sessions from 8:30 AM',
    'paid',
    '0722888410',
    'QKR4T8W2Z3',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days'
  ),
  (
    'NVS-2026-6190',
    'naivas',
    'Naivas Supermarket',
    'Sales Attendant',
    'Retail',
    30000,
    'Sales Bonus',
    'KSh 2,000',
    'Kevin Mutua Musyoka',
    '0733 210 955',
    'kevin.mutua@example.com',
    '31045981',
    'Imaara Dhaba',
    'Imaara Dhaba',
    '2026-10-28',
    'Flexible schedule all week',
    'pending',
    NULL,
    NULL,
    NULL,
    NOW() - INTERVAL '4 hours'
  ),
  (
    'CRF-2026-7331',
    'carrefour',
    'Carrefour Supermarket',
    'Chef',
    'Kitchen',
    50000,
    'Meal Allowance',
    'KSh 4,000',
    'Grace Achieng Odhiambo',
    '0701 998 244',
    'grace.achieng@example.com',
    '33190284',
    'The Junction',
    'The Junction',
    '2026-10-30',
    'Ready for bakery/kitchen orientation',
    'pending',
    NULL,
    NULL,
    NULL,
    NOW() - INTERVAL '2 hours'
  )
ON CONFLICT (reference_number) DO NOTHING;

-- Verification Check
SELECT count(*) AS total_applications_configured FROM public.applications;
