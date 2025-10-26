# Scripts

Utility scripts for managing the Pensieve application.

## update-allowed-email.js

Updates the allowed email address for authentication.

**Usage:**

```bash
# Using npm/bun script
bun run auth:update-email new-email@example.com

# Or directly
node scripts/update-allowed-email.js new-email@example.com
```

**What it does:**
- Updates the PostgreSQL trigger function to allow a different email
- The trigger enforces email restriction at the database level
- Only the specified email can create an account and access the application

**After running:**
- Update your `.env.local` file to match (for documentation):
  ```
  ALLOWED_EMAIL=new-email@example.com
  ```
- The `ALLOWED_EMAIL` in `.env.local` is for reference only
- The actual restriction is enforced by the database trigger

**Note:** This requires a database connection. Make sure your `.env.local` has a valid `DATABASE_URL`.

