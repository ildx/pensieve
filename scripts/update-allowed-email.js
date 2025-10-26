#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const postgres = require('postgres');

const sql = postgres(process.env.DATABASE_URL);

async function updateAllowedEmail() {
  const newEmail = process.argv[2];
  
  if (!newEmail) {
    console.error('❌ Error: Please provide an email address');
    console.log('\nUsage: node scripts/update-allowed-email.js <email>');
    console.log('Example: node scripts/update-allowed-email.js new-email@example.com\n');
    process.exit(1);
  }
  
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(newEmail)) {
    console.error('❌ Error: Invalid email format');
    process.exit(1);
  }
  
  console.log(`Updating allowed email to: ${newEmail}\n`);
  
  try {
    // Update the trigger function
    await sql`
      CREATE OR REPLACE FUNCTION check_allowed_email()
      RETURNS TRIGGER AS $$
      BEGIN
        IF NEW.email != ${newEmail} THEN
          RAISE EXCEPTION 'Unauthorized: This email address is not allowed to access this application';
        END IF;
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;
    
    console.log('✅ Database trigger updated successfully!');
    console.log(`\nOnly ${newEmail} can now access the application.`);
    console.log('\n💡 Tip: Update your .env.local ALLOWED_EMAIL to match (for documentation purposes):\n');
    console.log(`   ALLOWED_EMAIL=${newEmail}\n`);
    
  } catch (error) {
    console.error('❌ Error updating trigger:', error.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

updateAllowedEmail();

