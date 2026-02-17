const { createClient } = require('@supabase/supabase-js');
const { Connection, PublicKey } = require('@solana/web3.js');
require('dotenv').config({ path: '.env.local' });

async function syncBalance() {
    const rpc = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || process.env.NEXT_PUBLIC_RPC_URL;
    const connection = new Connection(rpc, 'confirmed');
    const treasuryWallet = new PublicKey(process.env.NEXT_PUBLIC_TREASURY_ADDRESS);
    const mint = new PublicKey(process.env.NEXT_PUBLIC_SNOW_MINT);
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    console.log("🔄 Syncing Supabase with Real Blockchain Balance...");

    const allAccounts = await connection.getParsedTokenAccountsByOwner(treasuryWallet, { mint: mint });
    let blockchainBalance = 0;
    allAccounts.value.forEach(acc => {
        blockchainBalance += acc.account.data.parsed.info.tokenAmount.uiAmount;
    });

    console.log(`💰 Real Balance found on chain: ${blockchainBalance}`);

    const { error } = await supabase
        .from('game_state')
        .update({ treasury_balance: blockchainBalance })
        .eq('id', 1);

    if (error) {
        console.error("❌ Sync failed:", error.message);
    } else {
        console.log("✅ Supabase Sync Successful!");
    }
}

syncBalance();
