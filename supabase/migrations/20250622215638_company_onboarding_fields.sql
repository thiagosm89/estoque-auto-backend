-- Add new fields to the companies table for onboarding purposes
ALTER TABLE public.companies
ADD COLUMN contact_phone VARCHAR(20),
ADD COLUMN legal_representative_email VARCHAR(255),
ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE;
