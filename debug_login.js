// Quick debug script - checks if registration and login work end-to-end
const supabase = require('./utils/supabase');

async function debugLogin() {
    const testPhone = '9876543210';
    
    console.log('\n=== Checking if riders table has any data ===');
    const { data: allRiders, error: allErr } = await supabase.from('riders').select('id, phone, "fullName", email').limit(5);
    if (allErr) {
        console.error('❌ Cannot read riders table:', allErr.message);
        console.log('   Code:', allErr.code);
        console.log('   Hint:', allErr.hint);
    } else {
        console.log(`✅ Found ${allRiders?.length || 0} riders in DB`);
        if (allRiders?.length > 0) {
            console.log('   Sample phones:', allRiders.map(r => r.phone));
        }
    }

    console.log('\n=== Checking RLS policies ===');
    const { data: rls, error: rlsErr } = await supabase.from('riders').select('count').limit(1);
    if (rlsErr) {
        console.error('❌ RLS issue:', rlsErr.message);
    } else {
        console.log('✅ RLS allows read access');
    }

    console.log('\n=== Testing insert with quoted column names ===');
    const testRider = {
        id: 'test-' + Date.now(),
        "fullName": "Debug Test User",
        email: `debug_${Date.now()}@test.local`,
        password: 'testpass',
        phone: '8888888888',
        state: 'Karnataka',
        city: 'Bangalore',
        pincode: '560001',
        "deliveryPlatform": 'Swiggy',
        "experienceYears": '1-2',
        "isActive": true,
        "totalPoints": 10,
        "totalDeliveries": 0,
        rating: 5.0,
        "referralCode": 'DBGTEST',
        referrals: 0,
        language: 'en',
        tags: [],
        challenges: [],
        "evChallenges": [],
        "petrolChallenges": [],
        "switchTriggers": [],
        "consentPrivacy": true,
        "consentMarketing": false,
        "consentTerms": true
    };

    const { data: insertData, error: insertErr } = await supabase.from('riders').insert(testRider).select();
    if (insertErr) {
        console.error('❌ Insert failed:', insertErr.message);
        console.log('   Code:', insertErr.code);
        console.log('   Details:', insertErr.details);
        console.log('   Hint:', insertErr.hint);
    } else {
        console.log('✅ Insert succeeded! Row saved.');
        // Clean up
        await supabase.from('riders').delete().eq('phone', '8888888888');
        console.log('   (Test record cleaned up)');
    }

    console.log('\n=== Searching by phone ===');
    if (allRiders?.length > 0) {
        const testPhoneReal = allRiders[0].phone;
        const { data: found, error: findErr } = await supabase.from('riders').select('*').eq('phone', testPhoneReal);
        if (findErr) {
            console.error('❌ Phone lookup failed:', findErr.message);
        } else {
            console.log(`✅ Phone lookup for ${testPhoneReal}: found ${found?.length} record(s)`);
        }
    } else {
        console.log('⚠️ No existing riders to test phone lookup');
    }

    process.exit(0);
}

debugLogin().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
