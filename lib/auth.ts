import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { passkey } from 'better-auth/plugins/passkey'
import { db } from './db/client'

if (!process.env.BETTER_AUTH_SECRET) {
  throw new Error('BETTER_AUTH_SECRET environment variable is required')
}

if (!process.env.BETTER_AUTH_URL && process.env.NODE_ENV === 'production') {
  throw new Error('BETTER_AUTH_URL environment variable is required in production')
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    // Use postgres-js provider since our client is postgres-js
    provider: 'pg',
  }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
  trustedOrigins: process.env.BETTER_AUTH_URL
    ? [process.env.BETTER_AUTH_URL]
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // We'll use email just for identification
    autoSignIn: true,
  },
  plugins: [
    passkey({
      rpName: 'Pensieve',
      // Let the library infer rpID and origin from the incoming request to avoid mismatches
    }),
  ],
  // Note: Email restriction is enforced at the database level via PostgreSQL trigger
  // See database trigger: check_allowed_email() and enforce_allowed_email
})
