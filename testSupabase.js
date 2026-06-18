const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zjqlkaewliccvgxqlnao.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqcWxrYWV3bGljY3ZneHFsbmFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1MDgwMjEsImV4cCI6MjA5NzA4NDAyMX0.8l03uovXMhN9c4HBIQuEOMuNRZ0IVf-HIRtGZZqScs4';
const supabase = createClient(supabaseUrl, supabaseKey);

async function listTables() {
  const { data, error } = await supabase.from('riders').select('*').limit(1);
  if (error) {
    console.error('Error fetching riders:', error.message);
  } else {
    console.log('Successfully queried riders. Data:', data);
  }
}

listTables();
