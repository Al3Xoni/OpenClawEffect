const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    const { data, error } = await supabase.from('game_state').select('*').eq('id', 1).single();
    if (error) {
        console.error("Error fetching game state:", error);
    } else {
        console.log("Current Game State:", data);
    }
}

check();
