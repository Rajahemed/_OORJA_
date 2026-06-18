const supabase = require('./utils/supabase');

async function test() {
  // Get all columns from the first row
  const { data, error } = await supabase.from('riders').select('*').limit(3);
  console.log('Error:', JSON.stringify(error));
  if (data && data.length > 0) {
    console.log('=== ALL COLUMN NAMES ===');
    console.log(Object.keys(data[0]).join('\n'));
    console.log('\n=== SAMPLE ROWS ===');
    data.forEach((row, i) => {
      console.log(`\nRow ${i+1}:`, JSON.stringify(row, null, 2));
    });
  } else {
    console.log('No rows found');
  }
}

test().catch(console.error);
