-- Seed data for the estoque-auto-backend database

-- Insert sample companies
INSERT INTO companies (name, cnpj, email, phone, address, city, state, zip_code) VALUES
('Auto Estoque Ltda', '12345678000190', 'contato@autoestoque.com', '(11) 99999-9999', 'Rua das Flores, 123', 'São Paulo', 'SP', '01234-567'),
('Carros Premium', '98765432000110', 'contato@carrospremium.com', '(21) 88888-8888', 'Av. Copacabana, 456', 'Rio de Janeiro', 'RJ', '22070-001');

-- Insert sample vehicle categories
INSERT INTO vehicle_categories (company_id, name, description) VALUES
((SELECT id FROM companies WHERE cnpj = '12345678000190'), 'Carros', 'Veículos de passeio'),
((SELECT id FROM companies WHERE cnpj = '12345678000190'), 'Motos', 'Motocicletas'),
((SELECT id FROM companies WHERE cnpj = '12345678000190'), 'Caminhões', 'Veículos comerciais'),
((SELECT id FROM companies WHERE cnpj = '98765432000110'), 'Luxo', 'Veículos de luxo'),
((SELECT id FROM companies WHERE cnpj = '98765432000110'), 'Esportivos', 'Veículos esportivos');

-- Insert sample vehicles
INSERT INTO vehicles (company_id, category_id, brand, model, year, color, license_plate, vin, mileage, fuel_type, transmission, engine_size, purchase_price, sale_price, status, description) VALUES
((SELECT id FROM companies WHERE cnpj = '12345678000190'), 
 (SELECT id FROM vehicle_categories WHERE name = 'Carros' AND company_id = (SELECT id FROM companies WHERE cnpj = '12345678000190')),
 'Toyota', 'Corolla', 2020, 'Prata', 'ABC-1234', '1HGBH41JXMN109186', 45000, 'Flex', 'Automático', '2.0L', 85000.00, 95000.00, 'available', 'Carro em excelente estado, revisado'),
 
((SELECT id FROM companies WHERE cnpj = '12345678000190'), 
 (SELECT id FROM vehicle_categories WHERE name = 'Carros' AND company_id = (SELECT id FROM companies WHERE cnpj = '12345678000190')),
 'Honda', 'Civic', 2019, 'Preto', 'DEF-5678', '2T1BURHE0JC123456', 38000, 'Flex', 'Automático', '1.8L', 75000.00, 85000.00, 'available', 'Carro conservado, único dono'),
 
((SELECT id FROM companies WHERE cnpj = '12345678000190'), 
 (SELECT id FROM vehicle_categories WHERE name = 'Motos' AND company_id = (SELECT id FROM companies WHERE cnpj = '12345678000190')),
 'Honda', 'CG 150', 2021, 'Vermelho', 'GHI-9012', '3VWDX7AJ5DM123456', 15000, 'Gasolina', 'Manual', '150cc', 12000.00, 15000.00, 'available', 'Moto nova, pouca quilometragem'),
 
((SELECT id FROM companies WHERE cnpj = '98765432000110'), 
 (SELECT id FROM vehicle_categories WHERE name = 'Luxo' AND company_id = (SELECT id FROM companies WHERE cnpj = '98765432000110')),
 'BMW', 'Série 7', 2022, 'Branco', 'JKL-3456', '4T1BF1FK5CU123456', 25000, 'Gasolina', 'Automático', '3.0L', 450000.00, 520000.00, 'available', 'Veículo de luxo, completo');

-- Insert sample suppliers
INSERT INTO suppliers (company_id, name, cnpj, email, phone, address, city, state, zip_code, contact_person) VALUES
((SELECT id FROM companies WHERE cnpj = '12345678000190'), 'Distribuidora Auto Ltda', '11111111000111', 'contato@distribuidora.com', '(11) 11111-1111', 'Rua dos Fornecedores, 100', 'São Paulo', 'SP', '01000-000', 'Carlos Fornecedor'),
((SELECT id FROM companies WHERE cnpj = '12345678000190'), 'Importadora Veículos', '22222222000122', 'contato@importadora.com', '(11) 22222-2222', 'Av. das Importações, 200', 'São Paulo', 'SP', '02000-000', 'Ana Importadora'),
((SELECT id FROM companies WHERE cnpj = '98765432000110'), 'Luxury Cars Import', '33333333000133', 'contato@luxurycars.com', '(21) 33333-3333', 'Rua do Luxo, 300', 'Rio de Janeiro', 'RJ', '22000-000', 'João Luxury');

-- Insert sample customers
INSERT INTO customers (company_id, name, cpf_cnpj, email, phone, address, city, state, zip_code) VALUES
((SELECT id FROM companies WHERE cnpj = '12345678000190'), 'João Cliente', '12345678900', 'joao@email.com', '(11) 44444-4444', 'Rua do Cliente, 400', 'São Paulo', 'SP', '03000-000'),
((SELECT id FROM companies WHERE cnpj = '12345678000190'), 'Maria Compradora', '98765432100', 'maria@email.com', '(11) 55555-5555', 'Av. da Compradora, 500', 'São Paulo', 'SP', '04000-000'),
((SELECT id FROM companies WHERE cnpj = '98765432000110'), 'Empresa ABC Ltda', '44444444000144', 'contato@empresaabc.com', '(21) 66666-6666', 'Rua da Empresa, 600', 'Rio de Janeiro', 'RJ', '23000-000');

-- Note: user_profiles will be created automatically by the trigger when users sign up
-- The trigger will use the metadata from auth.users to create the profile 