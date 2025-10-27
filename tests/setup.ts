// Set up environment variables BEFORE any imports
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test_db'
process.env.BETTER_AUTH_SECRET = process.env.BETTER_AUTH_SECRET || 'test-secret-key-for-testing-only'
process.env.BETTER_AUTH_URL = process.env.BETTER_AUTH_URL || 'http://localhost:3000'
process.env.NEXT_PUBLIC_BETTER_AUTH_URL = process.env.NEXT_PUBLIC_BETTER_AUTH_URL || 'http://localhost:3000'
process.env.ALLOWED_EMAILS = process.env.ALLOWED_EMAILS || 'test@example.com,allowed@example.com'
process.env.NODE_ENV = process.env.NODE_ENV || 'test'

import '@testing-library/jest-dom'
