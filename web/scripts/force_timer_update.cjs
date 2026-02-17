const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function forceUpdateTimer() {
    console.log("🚀 Reseting current round timer to 5000s in Supabase...");
    
    const newTimerEnd = new Date(Date.now() + 5000 * 1000).toISOString();
    
    const { data, error } = await supabase
        .from('game_state')
        .update({ 
            timer_end: newTimerEnd,
            updated_at: new Date().toISOString()
        })
        .eq('id', 1)
        .select();

    if (error) {
        console.error("❌ Error updating Supabase:", error.message);
    } else {
        console.log("✅ Success! Current round timer set to end at:", newTimerEnd);
        console.log("Check your website now!");
    }
}

forceUpdateTimer();
