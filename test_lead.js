require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
async function test() {
  const { data, error } = await supabase.from('email_logs').select('id').limit(1);
  console.log('email_logs:', error ? error.message : 'exists');
}
test();
