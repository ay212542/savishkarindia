import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const id = 'EMP-501154';
    console.log(`Checking for ID: ${id}`);

    // 1. Direct fetch from profiles
    const { data: profile, error: err1 } = await supabase
        .from('profiles')
        .select('*')
        .eq('membership_id', id);
    console.log('Direct profiles fetch:', profile, err1);

    // 2. RPC fetch
    const { data: rpc, error: err2 } = await supabase
        .rpc('get_member_public_profile', { lookup_id: id });
    console.log('RPC fetch:', rpc, err2);
}

check();
