require('dotenv').config();
const supabase = require('./utils/supabase');

async function test() {
    try {
        console.log("Checking supabase connectivity...");
        const { data, error } = await supabase.from('admin_users').select('id');
        console.log("Data:", data, "Error:", error);
    } catch(err) {
        console.error("Caught error:", err);
    }
}
test();
