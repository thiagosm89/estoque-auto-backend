-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types required for user profiles
CREATE TYPE public.user_role AS ENUM ('admin', 'company', 'employee');

-- Create companies table
CREATE TABLE public.companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18) UNIQUE NOT NULL,
    email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    contact_phone VARCHAR(20),
    legal_representative_email VARCHAR(255),
    onboarding_completed BOOLEAN DEFAULT FALSE
);

-- Create user_profiles table to extend auth.users
CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role public.user_role DEFAULT 'admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_companies_cnpj ON public.companies(cnpj);
CREATE INDEX idx_user_profiles_company_id ON public.user_profiles(company_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
-- Users can view their own profile.
CREATE POLICY "Users can view their own profile" ON public.user_profiles FOR SELECT USING (auth.uid() = id);
-- Users can update their own profile.
CREATE POLICY "Users can update their own profile" ON public.user_profiles FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for companies
-- Users can only view the company they belong to.
CREATE POLICY "Users can view their own company" ON public.companies FOR SELECT USING (
    id IN (SELECT company_id FROM public.user_profiles WHERE user_profiles.id = auth.uid())
);
-- Admins of a company can update it.
CREATE POLICY "Admins can update their own company" ON public.companies FOR UPDATE USING (
    id IN (SELECT company_id FROM public.user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'admin')
) WITH CHECK (
    id IN (SELECT company_id FROM public.user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'admin')
);

-- Function to handle new user registration
-- This function creates a company and a user profile in a single transaction.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_company_id UUID;
    user_first_name TEXT;
    user_last_name TEXT;
BEGIN
    -- 1. Insert a new company based on metadata, linking it to the owner (the new user)
    INSERT INTO public.companies (owner_id, name, cnpj, email)
    VALUES (
        NEW.id, -- Set the owner_id to the new user's id
        NEW.raw_user_meta_data->>'company_name',
        NEW.raw_user_meta_data->>'cnpj',
        NEW.email
    ) RETURNING id INTO new_company_id;

    -- Set default names if not provided in metadata
    user_first_name := COALESCE(NEW.raw_user_meta_data->>'first_name', 'Admin');
    user_last_name := COALESCE(NEW.raw_user_meta_data->>'last_name', 'Principal');

    -- 2. Insert into user_profiles using the new user's id and the new company_id
    INSERT INTO public.user_profiles (id, company_id, first_name, last_name, role)
    VALUES (
        NEW.id,
        new_company_id,
        user_first_name,
        user_last_name,
        'admin' -- The first user is always an admin
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to execute the function when a new user signs up in auth.users
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user(); 