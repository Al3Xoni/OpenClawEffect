const { Connection, PublicKey } = require('@solana/web3.js');
const { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } = require('@solana/spl-token');
require('dotenv').config({ path: '.env.local' });

async function findLostTokens() {
    const rpc = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || process.env.NEXT_PUBLIC_RPC_URL;
    const connection = new Connection(rpc, 'confirmed');
    const treasuryWallet = new PublicKey(process.env.NEXT_PUBLIC_TREASURY_ADDRESS);
    const mint = new PublicKey(process.env.NEXT_PUBLIC_SNOW_MINT);

    console.log(`🔍 Scanning ALL accounts for Treasury: ${treasuryWallet.toBase58()}`);
    console.log(`Token Mint: ${mint.toBase58()}`);

    const allAccounts = await connection.getParsedTokenAccountsByOwner(treasuryWallet, {
        mint: mint
    });

    if (allAccounts.value.length === 0) {
        console.log("❌ NO TOKEN ACCOUNTS FOUND.");
        return;
    }

    console.log(`\n✅ Found ${allAccounts.value.length} accounts:`);
    let total = 0;

    allAccounts.value.forEach((acc, i) => {
        const info = acc.account.data.parsed.info;
        const amount = info.tokenAmount.uiAmount;
        const programId = acc.account.owner;
        console.log(`--- ACCOUNT #${i+1} ---`);
        console.log(`Address: ${acc.pubkey.toBase58()}`);
        console.log(`Balance: ${amount}`);
        console.log(`Program: ${programId}`);
        total += amount;
    });

    console.log(`\n💰 TOTAL BLOCKCHAIN BALANCE: ${total}`);
}

findLostTokens().catch(console.error);
