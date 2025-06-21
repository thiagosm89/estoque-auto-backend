// Setup file for Jest tests
import dotenv from 'dotenv'

// Load environment variables for tests
dotenv.config({ path: '.env.test' })

// Mock Supabase client for tests
jest.mock('@supabase/supabase-js', () => ({
    createClient: jest.fn(() => ({
        from: jest.fn(() => ({
            select: jest.fn(() => ({
                eq: jest.fn(() => ({
                    single: jest.fn(() => Promise.resolve({ data: null, error: null }))
                }))
            })),
            insert: jest.fn(() => ({
                select: jest.fn(() => ({
                    single: jest.fn(() => Promise.resolve({ data: null, error: null }))
                }))
            })),
            update: jest.fn(() => ({
                eq: jest.fn(() => ({
                    select: jest.fn(() => ({
                        single: jest.fn(() => Promise.resolve({ data: null, error: null }))
                    }))
                }))
            })),
            delete: jest.fn(() => ({
                eq: jest.fn(() => Promise.resolve({ error: null }))
            }))
        })),
        rpc: jest.fn(() => Promise.resolve({ data: null, error: null }))
    }))
}))

// Global test setup
beforeAll(() => {
    // Setup any global test configuration
})

afterAll(() => {
    // Cleanup after all tests
})

beforeEach(() => {
    // Setup before each test
    jest.clearAllMocks()
}) 