const supabase = require('./utils/supabase');

async function cleanData() {
    console.log("Cleaning old rider data...");
    
    // Delete all records from the `riders` table.
    // In Supabase, to delete all, we usually can use something like:
    // .delete().neq('id', '0')
    const { data, error } = await supabase
        .from('riders')
        .delete()
        .neq('phone', '0'); // using a generic filter to delete all

    if (error) {
        console.error("Error cleaning data:", error);
    } else {
        console.log("Successfully cleaned all rider data!");
    }
}

cleanData();
