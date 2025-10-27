import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set')
}

// Disable prefetch as it's not supported for "Transaction" pool mode
// Keep a single shared connection pool; keep limits low for pooler
const client = postgres(process.env.DATABASE_URL, {
  prepare: false,
  max: 1,
  idle_timeout: 2,
  connect_timeout: 5,
  ssl: 'require',
})

export const db = drizzle(client, { schema })

// Export raw client for lightweight queries (e.g., email validation)
export const sqlClient = client
