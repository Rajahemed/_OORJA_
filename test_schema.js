require('dotenv').config();
async function checkSchema() {
  const url = `${process.env.SUPABASE_URL}/rest/v1/?apikey=${process.env.SUPABASE_KEY}`;
  const response = await fetch(url);
  const data = await response.json();
  console.log(Object.keys(data));
  if (data.components) console.log(Object.keys(data.components.schemas));
}
checkSchema();
