const { 
    Connection, 
    Keypair, 
    PublicKey, 
    SystemProgram, 
    Transaction, 
    sendAndConfirmTransaction 
} = require('@solana/web3.js');
const { createClient } = require('@supabase/supabase-js');
const bs58 = require('bs58');
const fs = require('fs');
const path = require('path');

// --- LOAD ENV ---
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
} else {
    require('dotenv').config({ path: path.resolve(__dirname, '../../.env.local') });
}

// --- CONFIGURATION ---
const RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || process.env.NEXT_PUBLIC_RPC_URL || "https://ethelind-zpmkg8-fast-mainnet.helius-rpc.com";
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; 
const TREASURY_KEY_STRING = process.env.TREASURY_PRIVATE_KEY; 
const DEV_WALLET_ADDRESS = "CCxBFjohSTWpLAtTG7KGJTTnafSibsata4N2JhBftJNx";

// --- VALIDATION ---
if (!TREASURY_KEY_STRING || !SUPABASE_URL || !SUPABASE_KEY) {
    console.error("❌ MISSING CONFIG: Check .env.local for keys.");
    process.exit(1);
}

// --- INITIALIZATION ---
const connection = new Connection(RPC_URL, "confirmed");
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

// Decode Treasury Keypair
let treasuryKeypair;
try {
    const decode = bs58.decode || bs58.default?.decode;
    if (!decode) throw new Error("bs58 decode function not found");
    treasuryKeypair = Keypair.fromSecretKey(decode(TREASURY_KEY_STRING));
} catch (e) {
    console.error("❌ Invalid Key:", e.message);
    process.exit(1);
}

// --- LOGIC ---

async function executePayout(gameState, roundId) {
    try {
        console.log(`💰 Processing Payout for Round ${roundId}...`);
        await supabase.from('rounds').update({ status: 'processing_payout' }).eq('id', roundId);

        const balanceLamports = await connection.getBalance(treasuryKeypair.publicKey);
        // Reserve 0.005 SOL for fees
        const distributableLamports = balanceLamports - 5000000; 

        if (distributableLamports <= 0) {
            console.log("⚠️ Treasury empty (or low balance), completing without transfers.");
        } else {
            const winners = gameState.last_pushers.slice(0, 3);
            const instructions = [];
            let totalDistributed = 0;

            // Winner 1 (30%)
            if (winners[0]) {
                const amt = Math.floor(distributableLamports * 0.3);
                instructions.push(SystemProgram.transfer({ fromPubkey: treasuryKeypair.publicKey, toPubkey: new PublicKey(winners[0]), lamports: amt }));
                totalDistributed += amt;
            }
            // Winner 2 (20%)
            if (winners[1]) {
                const amt = Math.floor(distributableLamports * 0.2);
                instructions.push(SystemProgram.transfer({ fromPubkey: treasuryKeypair.publicKey, toPubkey: new PublicKey(winners[1]), lamports: amt }));
                totalDistributed += amt;
            }
            // Winner 3 (10%)
            if (winners[2]) {
                const amt = Math.floor(distributableLamports * 0.1);
                instructions.push(SystemProgram.transfer({ fromPubkey: treasuryKeypair.publicKey, toPubkey: new PublicKey(winners[2]), lamports: amt }));
                totalDistributed += amt;
            }

            // Dev Share (Rest ~40%)
            const devShare = distributableLamports - totalDistributed;
            if (devShare > 0) {
                instructions.push(SystemProgram.transfer({ fromPubkey: treasuryKeypair.publicKey, toPubkey: new PublicKey(DEV_WALLET_ADDRESS), lamports: devShare }));
            }

            if (instructions.length > 0) {
                const tx = new Transaction().add(...instructions);
                const sig = await sendAndConfirmTransaction(connection, tx, [treasuryKeypair]);
                console.log(`✅ SOL Distributed. TX: ${sig}`);
            }
        }

        // Finalize in DB
        await supabase.from('rounds').update({ 
            status: 'completed', 
            winner_wallet: gameState.last_pushers[0] || 'none',
            total_pot: balanceLamports / 1e9
        }).eq('id', roundId);

    } catch (err) {
        console.error("❌ Payout Error:", err.message);
        await supabase.from('rounds').update({ status: 'error' }).eq('id', roundId);
    }
}

async function checkAndPayout() {
    try {
        const { data: gameState, error: stateError } = await supabase
            .from('game_state')
            .select('*')
            .eq('id', 1)
            .single();

        if (stateError) throw new Error(stateError.message);

        const now = Date.now();
        const timerEnd = new Date(gameState.timer_end).getTime();
        const timeLeft = (timerEnd - now) / 1000;

        // Log status every 30s
        if (Math.floor(Date.now() / 1000) % 30 === 0) {
             console.log(`⏳ Round ${gameState.current_round_id} | Time Left: ${timeLeft.toFixed(0)}s`);
        }

        // Check if we need to close the round
        const { data: currentRound } = await supabase
            .from('rounds')
            .select('*')
            .eq('id', gameState.current_round_id)
            .single();

        if (timeLeft <= 0 && currentRound && currentRound.status === 'active') {
            console.log(`🚨 ROUND ${gameState.current_round_id} ENDED! Starting Payout Sequence...`);
            
            await executePayout(gameState, currentRound.id);
            
            // Start New Round
            const { data: newRound } = await supabase.from('rounds').insert({ status: 'active' }).select().single();
            await supabase.from('game_state').update({ 
                current_round_id: newRound.id,
                push_count: 0,
                last_pushers: [],
                timer_end: new Date(Date.now() + 1800 * 1000).toISOString()
            }).eq('id', 1);
            
            console.log(`✨ New Round Started: ${newRound.id}`);
        }

    } catch (err) {
        // Ignore network blips
        if (!err.message.includes("fetch failed")) {
            console.error(`⚠️ Loop Error:`, err.message);
        }
    }
}

console.log("🤖 Payout Manager Running (Monitoring mode)...");
// Check immediately then every 5s
checkAndPayout();
setInterval(checkAndPayout, 5000);