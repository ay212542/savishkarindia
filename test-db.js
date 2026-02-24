// test-db.js
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
    console.error("Missing credentials in .env");
    process.exit(1);
}

const supabase = createClient(url, key);

async function testConnection() {
    console.log("Attempting direct connection to:", url);
    try {
        const start = Date.now();
        const { data, error } = await supabase.from('profiles').select('*').limit(1);
        const ms = Date.now() - start;
        if (error) {
            console.error(`❌ DB Connection Failed (${ms}ms):`, error.message);
        } else {
            console.log(`✅ DB Connection Success (${ms}ms). Found profile:`, !!data?.length);
        }
    } catch (err) {
        console.error("❌ Exception during connection:", err);
    }
}

testConnection();
