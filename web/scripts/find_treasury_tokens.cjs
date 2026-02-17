const { Connection, PublicKey } = require('@solana/web3.js');
const { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } = require('@solana/spl-token');
require('dotenv').config({ path: '.env.local' });

async function findLostTokens() {
    const connection = new Connection(process.env.NEXT_PUBLIC_RPC_URL, 'confirmed');
    const treasuryWallet = new PublicKey(process.env.NEXT_PUBLIC_TREASURY_ADDRESS);
    const mint = new PublicKey(process.env.NEXT_PUBLIC_SNOW_MINT);

    console.log(`🔍 Scanning Treasury (${treasuryWallet.toBase58()}) for Mint: ${mint.toBase58()}`);

    // Check both Token Program and Token-2022
    const programs = [TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID];
    let totalFound = 0;

    for (const programId of programs) {
        console.log(`
Checking Program: ${programId.toBase58()}`);
        const accounts = await connection.getParsedTokenAccountsByOwner(treasuryWallet, {
            mint: mint,
            programId: programId
        });

        if (accounts.value.length === 0) {
            console.log("No accounts found for this program.");
            continue;
        }

        accounts.value.forEach((acc, i) => {
            const amount = acc.account.data.parsed.info.tokenAmount.uiAmount;
            const address = acc.pubkey.toBase58();
            console.log(`[${i}] ATA: ${address} | Balance: ${amount}`);
            totalFound += amount;
        });
    }

    console.log(`
==========================================`);
    console.log(`💰 TOTAL $SNOW IN TREASURY: ${totalFound}`);
    console.log(`==========================================`);
}

findLostTokens();
