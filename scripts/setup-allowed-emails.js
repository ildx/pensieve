require('dotenv').config({ path: '.env.local' })
const postgres = require('postgres')

const emailsArg = process.argv[2]
// Support new plural var; fallback to legacy for compatibility
const envEmails = process.env.ALLOWED_EMAILS || process.env.ALLOWED_EMAIL || ''
const emails = (emailsArg || envEmails)
  .split(',')
  .map(e => e.trim())
  .filter(Boolean)
;(async () => {
  const sql = postgres(process.env.DATABASE_URL)
  try {
    console.log('Setting up allowed emails system...')

    // 1) Create table if not exists
    await sql`CREATE TABLE IF NOT EXISTS allowed_emails (email text PRIMARY KEY)`

    // 2) Upsert provided emails (normalize to lowercase for consistency)
    if (emails.length) {
      for (const email of emails) {
        const normalizedEmail = email.toLowerCase()
        await sql`INSERT INTO allowed_emails (email) VALUES (${normalizedEmail}) ON CONFLICT (email) DO NOTHING`
      }
      console.log(`✓ Ensured ${emails.length} allowed email(s)`)
    } else {
      console.log('No emails provided via args or ALLOWED_EMAILS env; skipping seeding')
    }

    // 3) Replace function to check table with case-insensitive comparison
    await sql`
      CREATE OR REPLACE FUNCTION check_allowed_email()
      RETURNS TRIGGER AS $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM allowed_emails WHERE LOWER(email) = LOWER(NEW.email)) THEN
          RAISE EXCEPTION 'Unauthorized: This email address is not allowed to access this application';
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `

    // 4) Ensure triggers exist on user table
    await sql`DROP TRIGGER IF EXISTS enforce_allowed_email ON "user"`
    await sql`DROP TRIGGER IF EXISTS enforce_allowed_email_on_update ON "user"`
    await sql`
      CREATE TRIGGER enforce_allowed_email
        BEFORE INSERT ON "user"
        FOR EACH ROW
        EXECUTE FUNCTION check_allowed_email()
    `
    await sql`
      CREATE TRIGGER enforce_allowed_email_on_update
        BEFORE UPDATE OF email ON "user"
        FOR EACH ROW
        WHEN (OLD.email IS DISTINCT FROM NEW.email)
        EXECUTE FUNCTION check_allowed_email()
    `

    console.log('✓ Triggers installed')
    console.log('✓ Allowed emails setup complete')
  } catch (e) {
    console.error('Error:', e.message)
  } finally {
    await sql.end()
  }
})()
