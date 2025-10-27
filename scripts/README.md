# Scripts

Utility scripts for managing the Pensieve application.

## setup-allowed-emails.js

Seeds the `allowed_emails` table and sets up database triggers for email restriction.

### Usage

```bash
# Using environment variable (recommended)
# Set ALLOWED_EMAILS in .env.local first
node scripts/setup-allowed-emails.js

# Or provide emails directly as argument
node scripts/setup-allowed-emails.js "email1@example.com,email2@example.com"

# Or use the npm script (uses env variable)
bun run db:setup:fresh  # Includes this script
```

### What it does

1. Creates `allowed_emails` table if it doesn't exist
2. Inserts/updates allowed emails (normalized to lowercase)
3. Creates PostgreSQL function `check_allowed_email()`
4. Sets up triggers on `user` table:
   - `enforce_allowed_email` - Checks on INSERT
   - `enforce_allowed_email_on_update` - Checks on UPDATE

### Database Trigger

The trigger enforces email restriction at the database level:

```sql
CREATE OR REPLACE FUNCTION check_allowed_email()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM allowed_emails WHERE LOWER(email) = LOWER(NEW.email)) THEN
    RAISE EXCEPTION 'Unauthorized: This email address is not allowed to access this application';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

This provides the final security layer - even if client-side or API validation is bypassed, the database will reject unauthorized emails.

### Environment Variables

Requires:
- `DATABASE_URL` - PostgreSQL connection string
- `ALLOWED_EMAILS` (optional) - Comma-separated list of emails

### Example

```bash
# In .env.local
ALLOWED_EMAILS=alice@example.com,bob@example.com
DATABASE_URL=postgresql://...

# Run script
node scripts/setup-allowed-emails.js

# Output:
# Setting up allowed emails system...
# ✓ Ensured 2 allowed email(s)
# ✓ Triggers installed
# ✓ Allowed emails setup complete
```

## update-allowed-email.js

**Note**: This script is deprecated. Use `setup-allowed-emails.js` instead, which supports multiple emails.

### Migration Guide

**Old way:**
```bash
bun run auth:update-email new-email@example.com
```

**New way:**
```bash
# Update ALLOWED_EMAILS in .env.local
ALLOWED_EMAILS=new-email@example.com,other@example.com

# Re-run setup
bun run db:setup:fresh
```

## Requirements

Both scripts require:
- Node.js or Bun runtime
- `dotenv` package (installed)
- `postgres` package (installed)
- Valid `DATABASE_URL` in `.env.local`
- Database connection (Supabase or any PostgreSQL)

## Troubleshooting

### Connection Issues

**Error: `getaddrinfo ENOTFOUND`**
- Check `DATABASE_URL` is correct
- Use Supabase Connection Pooling URL (Transaction mode)
- Verify database is accessible

**Error: `Unable to check out process from the pool`**
- Database connection pool exhausted
- Try again in a few seconds
- Check if dev server is using too many connections

### Permission Issues

**Error: `permission denied for table`**
- Verify your database user has CREATE TABLE permissions
- Check Row Level Security (RLS) settings in Supabase

### Email Not Working

**Emails not being enforced:**
1. Check table exists: `bun run db:studio` → look for `allowed_emails`
2. Verify triggers exist:
   ```sql
   SELECT tgname FROM pg_trigger WHERE tgrelid = 'user'::regclass;
   ```
3. Re-run setup: `bun run db:setup:fresh`

## Integration with Application

### Three Layers of Email Validation

1. **Client-side** (`app/login/page.tsx`)
   - Validates email format with Zod
   - Calls `/api/validate-email` before passkey step
   - Provides immediate user feedback

2. **Server-side** (`app/api/validate-email/route.ts`)
   - Validates against `allowed_emails` table
   - Rate limited (5 req/10s per IP)
   - Generic error messages (no enumeration)

3. **Database-level** (This script's triggers)
   - Final enforcement layer
   - Cannot be bypassed
   - Protects against direct database access

### Security Benefits

- **Defense in Depth**: Multiple validation layers
- **Fail Secure**: Database rejects unauthorized users even if API is bypassed
- **Centralized Control**: Single source of truth (`allowed_emails` table)
- **Audit Trail**: Database logs all access attempts

## Development vs Production

### Development

- Uses `ALLOWED_EMAILS` env variable for fast iteration
- API has dev fast-path (skips DB query)
- Tolerant of rate limit errors

### Production

- Always queries `allowed_emails` table
- Strict rate limiting enforced
- Origin validation enabled
- Generic error messages only

## See Also

- **Setup Guide**: `docs/SETUP.md` - Complete setup instructions
- **Project Status**: `docs/PROJECT_STATUS.md` - Current implementation
- **Test Documentation**: `tests/README.md` - Testing the email validation
