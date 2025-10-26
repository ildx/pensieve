import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db/client";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: false, // We only want Google OAuth
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  // Restrict access to only your email
  callbacks: {
    async signIn({ user }) {
      const allowedEmail = process.env.ALLOWED_EMAIL;
      if (!allowedEmail) {
        console.error("ALLOWED_EMAIL environment variable is not set");
        return false;
      }
      
      const isAllowed = user.email === allowedEmail;
      
      if (!isAllowed) {
        console.log(`Unauthorized sign-in attempt from: ${user.email}`);
      }
      
      return isAllowed;
    },
  },
});

