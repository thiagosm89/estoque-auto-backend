// Database types
export interface Company {
    id: string
    name: string
    cnpj: string
    email?: string
    phone?: string
    address?: string
    city?: string
    state?: string
    zip_code?: string
    created_at: string
    updated_at: string
}

export interface UserProfile {
    id: string
    company_id: string
    first_name: string
    last_name: string
    role: 'admin' | 'manager' | 'employee'
    phone?: string
    is_active: boolean
    created_at: string
    updated_at: string
}

export interface VehicleCategory {
    id: string
    company_id: string
    name: string
    description?: string
    created_at: string
    updated_at: string
}

export interface Vehicle {
    id: string
    company_id: string
    category_id?: string
    brand: string
    model: string
    year: number
    color?: string
    license_plate?: string
    vin?: string
    mileage: number
    fuel_type?: string
    transmission?: string
    engine_size?: string
    purchase_price?: number
    sale_price?: number
    status: 'available' | 'sold' | 'maintenance' | 'reserved'
    description?: string
    images?: string[]
    created_at: string
    updated_at: string
}

export interface Supplier {
    id: string
    company_id: string
    name: string
    cnpj?: string
    email?: string
    phone?: string
    address?: string
    city?: string
    state?: string
    zip_code?: string
    contact_person?: string
    created_at: string
    updated_at: string
}

export interface Customer {
    id: string
    company_id: string
    name: string
    cpf_cnpj?: string
    email?: string
    phone?: string
    address?: string
    city?: string
    state?: string
    zip_code?: string
    created_at: string
    updated_at: string
}

export interface Transaction {
    id: string
    company_id: string
    vehicle_id: string
    customer_id?: string
    supplier_id?: string
    user_id?: string
    transaction_type: 'purchase' | 'sale' | 'transfer' | 'adjustment'
    amount: number
    transaction_date: string
    notes?: string
    created_at: string
    updated_at: string
}

export interface MaintenanceRecord {
    id: string
    company_id: string
    vehicle_id: string
    user_id?: string
    maintenance_type: string
    description?: string
    cost?: number
    maintenance_date: string
    next_maintenance_date?: string
    created_at: string
    updated_at: string
}

// API Request/Response types
export interface RegisterCompanyRequest {
    companyName: string
    cnpj: string
    email: string
    password: string
    confirmPassword: string
}

export interface LoginRequest {
    email: string
    password: string
}

export interface LoginResponse {
    user: {
        id: string
        email: string
        user_metadata: {
            nome: string
            tipo: string
            id_company: string
        }
    }
    session: {
        access_token: string
        refresh_token: string
    }
}

export interface ApiResponse<T = any> {
    data?: T
    error?: string
    message?: string
}

// Edge Function types
export interface EdgeFunctionRequest {
    method: string
    headers: Record<string, string>
    body?: any
}

export interface EdgeFunctionResponse {
    status: number
    headers: Record<string, string>
    body: string
}

// Supabase Auth types
export interface AuthUser {
    id: string
    email: string
    user_metadata: {
        nome: string
        tipo: string
        id_company: string
        first_name?: string
        last_name?: string
    }
    created_at: string
    updated_at: string
}

export interface AuthSession {
    access_token: string
    refresh_token: string
    expires_in: number
    expires_at: number
    user: AuthUser
} 