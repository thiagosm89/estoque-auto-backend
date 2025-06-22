-- Additional RLS policies for complete CRUD operations

-- Allow users to insert their own profile (for the trigger)
CREATE POLICY "Users can insert their own profile" ON public.user_profiles FOR INSERT WITH CHECK (
    auth.uid() = id
);

-- Allow users to delete their own profile
CREATE POLICY "Users can delete their own profile" ON public.user_profiles FOR DELETE USING (
    auth.uid() = id
);

-- Allow companies to be inserted (for registration)
CREATE POLICY "Allow company insertion" ON public.companies FOR INSERT WITH CHECK (true);

-- Allow companies to be deleted by their users
CREATE POLICY "Users can delete their own company" ON public.companies FOR DELETE USING (
    auth.uid() IN (SELECT id FROM public.user_profiles WHERE company_id = companies.id)
); 