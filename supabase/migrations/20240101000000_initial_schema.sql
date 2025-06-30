-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types required for user profiles
CREATE TYPE public.user_role AS ENUM ('admin', 'company', 'employee');

-- Create companies table
CREATE TABLE public.companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    fantasy_name VARCHAR(255) NOT NULL,
    corporate_name VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18) UNIQUE NOT NULL,
    email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    contact_phone VARCHAR(20),
    legal_representative_email VARCHAR(255),
    onboarding_completed BOOLEAN DEFAULT FALSE,
    legal_representative_name VARCHAR(255),
    legal_representative_cpf VARCHAR(14)
);

-- Create user_profiles table to extend auth.users
CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role public.user_role DEFAULT 'company',
    email VARCHAR(255) UNIQUE NOT NULL,
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
    -- Só insere empresa se fantasy_name não for nulo
    IF NEW.raw_user_meta_data->>'fantasy_name' IS NOT NULL THEN
        INSERT INTO public.companies (owner_id, fantasy_name, corporate_name, cnpj, email)
        VALUES (
            NEW.id,
            NEW.raw_user_meta_data->>'fantasy_name',
            NEW.raw_user_meta_data->>'corporate_name',
            NEW.raw_user_meta_data->>'cnpj',
            NEW.email
        ) RETURNING id INTO new_company_id;

        user_first_name := COALESCE(NEW.raw_user_meta_data->>'first_name', 'Admin');
        user_last_name := COALESCE(NEW.raw_user_meta_data->>'last_name', 'Principal');
        INSERT INTO public.user_profiles (id, company_id, first_name, last_name, role, email)
        VALUES (
            NEW.id,
            new_company_id,
            user_first_name,
            user_last_name,
            'company',
            NEW.email
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to execute the function when a new user signs up in auth.users
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Criar tabela de endereços da empresa
CREATE TABLE public.company_addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    address VARCHAR(255) NOT NULL,
    number INTEGER NOT NULL,
    complement VARCHAR(100),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(2) NOT NULL,
    cep VARCHAR(9) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de pagamentos/assinaturas da empresa
CREATE TABLE public.company_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    plan_type VARCHAR(20) NOT NULL, -- 'anual' ou 'semestral'
    plan_start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    plan_status VARCHAR(20) NOT NULL DEFAULT 'trial', -- 'trial', 'ativo', 'cancelado', etc
    card_holder_name VARCHAR(255) NOT NULL,
    card_holder_cpf VARCHAR(14) NOT NULL,
    card_last_digits VARCHAR(4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de textos dos termos de contratação
CREATE TABLE public.company_terms (
    hash VARCHAR(64) PRIMARY KEY, -- hash/checksum do texto
    version VARCHAR(20) NOT NULL,
    text TEXT NOT NULL,
    effective_from TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(hash)
);

-- Garante que só pode haver um termo ativo
CREATE UNIQUE INDEX only_one_active_term_idx ON public.company_terms (is_active)
WHERE is_active = TRUE;

-- Tabela de aceite dos termos
CREATE TABLE public.company_terms_acceptance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    payment_id UUID REFERENCES public.company_payments(id) ON DELETE SET NULL,
    term_hash VARCHAR(64) NOT NULL REFERENCES public.company_terms(hash),
    accepted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    signature_name VARCHAR(255) NOT NULL,
    signature_cpf VARCHAR(14) NOT NULL,
    user_ip VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger para impedir alteração da coluna hash em company_terms
CREATE OR REPLACE FUNCTION prevent_company_terms_hash_update()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.hash <> OLD.hash THEN
        RAISE EXCEPTION 'O campo hash não pode ser alterado após a inserção.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_company_terms_hash_update
BEFORE UPDATE ON public.company_terms
FOR EACH ROW
EXECUTE FUNCTION prevent_company_terms_hash_update();

-- Função transacional para onboarding (ajustada para receber a hash do termo)
CREATE OR REPLACE FUNCTION public.onboarding_company_transaction(
    payload jsonb
) RETURNS void AS $$
DECLARE
    v_company_id UUID;
    v_payment_id UUID;
BEGIN
    -- Buscar empresa pelo owner_id
    SELECT id INTO v_company_id FROM companies WHERE owner_id = (payload->>'owner_id')::uuid;
    IF v_company_id IS NULL THEN
        RAISE EXCEPTION 'Empresa não encontrada para o owner_id informado.';
    END IF;

    -- Atualizar dados do representante e onboarding
    UPDATE companies SET
        legal_representative_name = payload->>'legalRepresentativeName',
        legal_representative_cpf = payload->>'legalRepresentativeCpf',
        onboarding_completed = TRUE,
        onboarding_completed_at = NOW()
    WHERE id = v_company_id;

    -- Inserir endereço
    INSERT INTO company_addresses (
        company_id, address, number, complement, city, state, cep
    ) VALUES (
        v_company_id,
        payload->>'address',
        payload->>'number',
        payload->>'complement',
        payload->>'city',
        payload->>'state',
        payload->>'cep'
    );

    -- Criar pagamento
    INSERT INTO company_payments (
        company_id, plan_type, plan_start_date, plan_status,
        card_holder_name, card_holder_cpf, card_last_digits
    ) VALUES (
        v_company_id,
        payload->>'plan',
        NOW(),
        'trial',
        payload->>'cardHolderName',
        payload->>'cardHolderCpf',
        RIGHT(REGEXP_REPLACE(payload->>'cardNumber', '\\D', '', 'g'), 4)
    ) RETURNING id INTO v_payment_id;

    -- Criar aceite do termo usando a hash recebida
    INSERT INTO company_terms_acceptance (
        company_id, payment_id, term_hash, signature_name, signature_cpf
    ) VALUES (
        v_company_id,
        v_payment_id,
        payload->>'termHash',
        payload->>'signature',
        payload->>'signatureCpf'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 