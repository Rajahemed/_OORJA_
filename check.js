require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
async function check() {
  const { data: s1, error: e1 } = await supabase.from('sessions').select('*').limit(1);
  console.log('sessions table:', e1 ? e1.message : 'exists');
  
  const { data: s2, error: e2 } = await supabase.from('session_logs').select('*').limit(1);
  console.log('session_logs table:', e2 ? e2.message : 'exists');
  
  const { data: s3, error: e3 } = await supabase.from('visitors').select('*').limit(1);
  console.log('visitors table:', e3 ? e3.message : 'exists');
}
check();
