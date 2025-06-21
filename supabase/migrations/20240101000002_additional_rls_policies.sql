-- Additional RLS policies for complete CRUD operations

-- Vehicle Categories policies
CREATE POLICY "Users can insert categories for their company" ON vehicle_categories FOR INSERT WITH CHECK (
    company_id IN (SELECT company_id FROM user_profiles WHERE id = auth.uid())
);

CREATE POLICY "Users can update their company categories" ON vehicle_categories FOR UPDATE USING (
    company_id IN (SELECT company_id FROM user_profiles WHERE id = auth.uid())
);

CREATE POLICY "Users can delete their company categories" ON vehicle_categories FOR DELETE USING (
    company_id IN (SELECT company_id FROM user_profiles WHERE id = auth.uid())
);

-- Suppliers policies
CREATE POLICY "Users can insert suppliers for their company" ON suppliers FOR INSERT WITH CHECK (
    company_id IN (SELECT company_id FROM user_profiles WHERE id = auth.uid())
);

CREATE POLICY "Users can update their company suppliers" ON suppliers FOR UPDATE USING (
    company_id IN (SELECT company_id FROM user_profiles WHERE id = auth.uid())
);

CREATE POLICY "Users can delete their company suppliers" ON suppliers FOR DELETE USING (
    company_id IN (SELECT company_id FROM user_profiles WHERE id = auth.uid())
);

-- Customers policies
CREATE POLICY "Users can insert customers for their company" ON customers FOR INSERT WITH CHECK (
    company_id IN (SELECT company_id FROM user_profiles WHERE id = auth.uid())
);

CREATE POLICY "Users can update their company customers" ON customers FOR UPDATE USING (
    company_id IN (SELECT company_id FROM user_profiles WHERE id = auth.uid())
);

CREATE POLICY "Users can delete their company customers" ON customers FOR DELETE USING (
    company_id IN (SELECT company_id FROM user_profiles WHERE id = auth.uid())
);

-- Transactions policies
CREATE POLICY "Users can insert transactions for their company" ON transactions FOR INSERT WITH CHECK (
    company_id IN (SELECT company_id FROM user_profiles WHERE id = auth.uid())
);

CREATE POLICY "Users can update their company transactions" ON transactions FOR UPDATE USING (
    company_id IN (SELECT company_id FROM user_profiles WHERE id = auth.uid())
);

CREATE POLICY "Users can delete their company transactions" ON transactions FOR DELETE USING (
    company_id IN (SELECT company_id FROM user_profiles WHERE id = auth.uid())
);

-- Maintenance Records policies
CREATE POLICY "Users can insert maintenance records for their company" ON maintenance_records FOR INSERT WITH CHECK (
    company_id IN (SELECT company_id FROM user_profiles WHERE id = auth.uid())
);

CREATE POLICY "Users can update their company maintenance records" ON maintenance_records FOR UPDATE USING (
    company_id IN (SELECT company_id FROM user_profiles WHERE id = auth.uid())
);

CREATE POLICY "Users can delete their company maintenance records" ON maintenance_records FOR DELETE USING (
    company_id IN (SELECT company_id FROM user_profiles WHERE id = auth.uid())
);

-- Allow users to insert their own profile (for the trigger)
CREATE POLICY "Users can insert their own profile" ON user_profiles FOR INSERT WITH CHECK (
    auth.uid() = id
);

-- Allow users to delete their own profile
CREATE POLICY "Users can delete their own profile" ON user_profiles FOR DELETE USING (
    auth.uid() = id
);

-- Allow companies to be inserted (for registration)
CREATE POLICY "Allow company insertion" ON companies FOR INSERT WITH CHECK (true);

-- Allow companies to be deleted by their users
CREATE POLICY "Users can delete their own company" ON companies FOR DELETE USING (
    auth.uid() IN (SELECT id FROM user_profiles WHERE company_id = companies.id)
); 