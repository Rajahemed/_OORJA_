const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials. Make sure SUPABASE_URL and SUPABASE_KEY are set in your .env file.");
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
