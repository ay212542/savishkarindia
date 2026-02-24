import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const id = 'SAV-2026-42424';
    console.log(`Checking for ID: ${id}`);

    // 1. Get sample profiles first
    const { data: samples } = await supabase
        .from('profiles')
        .select('membership_id, full_name')
        .limit(5);
    console.log('\nSample profiles in DB:');
    samples?.forEach(p => console.log(`  - ${p.membership_id}: ${p.full_name}`));

    // 2. Direct fetch from profiles
    const { data: profile, error: err1 } = await supabase
        .from('profiles')
        .select('*')
        .eq('membership_id', id);
    console.log('\nDirect profiles fetch (exact match):', profile?.length || 0, 'records found');
    if (err1) console.log('Error:', err1);

    // 3. Fuzzy search
    const { data: fuzzy } = await supabase
        .from('profiles')
        .select('membership_id, full_name')
        .ilike('membership_id', '%42424%');
    console.log('\nFuzzy search for 42424:', fuzzy?.length || 0, 'records found');
    fuzzy?.forEach(p => console.log(`  - ${p.membership_id}: ${p.full_name}`));

    // 4. RPC fetch
    console.log('\nTrying RPC fetch...');
    const { data: rpc, error: err2 } = await supabase
        .rpc('get_member_public_profile', { lookup_id: id });
    console.log('RPC result:', rpc?.length || 0, 'records found');
    if (rpc && rpc.length > 0) {
        console.log('RPC Data:', JSON.stringify(rpc[0], null, 2));
    }
    if (err2) console.log('RPC Error:', err2);

    // 5. Count total profiles
    const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
    console.log('\nTotal profiles in database:', count);
}

check();
