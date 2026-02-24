import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function check() {
    const id = 'SAV-2026-41472';
    console.log('Checking for:', id);
    const { data, error } = await supabase.from('profiles').select('*').eq('membership_id', id);
    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Result:', data);
    }
    
    // Check partial matches
    const { data: data2 } = await supabase.from('profiles').select('membership_id').ilike('membership_id', '%41472%');
    console.log('Partial matches:', data2);
}

check();
