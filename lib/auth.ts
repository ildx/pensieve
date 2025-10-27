import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { passkey } from "better-auth/plugins/passkey";
import { db } from "./db/client";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    // Use postgres-js provider since our client is postgres-js
    provider: "postgres",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // We'll use email just for identification
    autoSignIn: true,
  },
  plugins: [
    passkey({
      rpName: "Pensieve",
      // Let the library infer rpID and origin from the incoming request to avoid mismatches
    }),
  ],
  // Note: Email restriction is enforced at the database level via PostgreSQL trigger
  // See database trigger: check_allowed_email() and enforce_allowed_email
});

