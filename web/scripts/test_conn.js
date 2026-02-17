const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const url = process.env.SUPABASE_URL || "https://dxtyjnkuvmnysilyvzxt.supabase.co";
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log(`Testing connection to: ${url}`);

async function test() {
    try {
        const res = await fetch(`${url}/rest/v1/game_state?select=*&id=eq.1`, {
            headers: {
                'apikey': key,
                'Authorization': `Bearer ${key}`
            }
        });
        console.log("Status:", res.status);
        const text = await res.text();
        console.log("Body:", text.substring(0, 100));
    } catch (e) {
        console.error("Fetch Error:", e);
    }
}

test();
