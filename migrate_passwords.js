require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt'); // Assuming bcrypt is used in server.js

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migratePasswords() {
  try {
    console.log("Generating bcrypt hash for '1234'...");
    const saltRounds = 10;
    const defaultPinHash = await bcrypt.hash('1234', saltRounds);

    console.log("Fetching existing riders...");
    const { data: riders, error: fetchError } = await supabase
      .from('riders')
      .select('id, phone');

    if (fetchError) throw fetchError;

    if (!riders || riders.length === 0) {
      console.log("No riders found.");
      return;
    }

    console.log(`Found ${riders.length} riders. Updating passwords to '1234'...`);

    let successCount = 0;
    let failCount = 0;

    for (const rider of riders) {
      const { error: updateError } = await supabase
        .from('riders')
        .update({ password: defaultPinHash })
        .eq('id', rider.id);

      if (updateError) {
        console.error(`Failed to update rider ${rider.phone}:`, updateError.message);
        failCount++;
      } else {
        successCount++;
      }
    }

    console.log(`Migration complete! Successfully updated: ${successCount}, Failed: ${failCount}`);
  } catch (error) {
    console.error("Migration error:", error);
  }
}

migratePasswords();
