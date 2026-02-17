const { Connection, Keypair, PublicKey, clusterApiUrl, Transaction } = require("@solana/web3.js");
const { createTransferCheckedInstruction, getOrCreateAssociatedTokenAccount } = require("@solana/spl-token");
const fs = require('fs');
const path = require('path');

async function main() {
    const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
    const SNOW_MINT = new PublicKey("EDauNNfEp1QvnBamXHnMd8C8H24hXfEURW8T6DDkpump");
    const TREASURY = new PublicKey("Djnmh6umG2NuBp4XoEmZrTzgotmq3Wn1fDLwZD2bErgf");
    
    // Load Bot 1
    const botPath = path.resolve(__dirname, "../../bots/keys/bot_1.json");
    const botKey = Uint8Array.from(JSON.parse(fs.readFileSync(botPath, 'utf-8')));
    const bot = Keypair.fromSecretKey(botKey);

    console.log(`🤖 Bot: ${bot.publicKey.toBase58()}`);
    
    // Get ATAs
    const botATA = await getOrCreateAssociatedTokenAccount(connection, bot, SNOW_MINT, bot.publicKey);
    const treasuryATA = await getOrCreateAssociatedTokenAccount(connection, bot, SNOW_MINT, TREASURY);

    console.log("📤 Sending 1000 SNOW...");

    const tx = new Transaction().add(
        createTransferCheckedInstruction(
            botATA.address,
            SNOW_MINT,
            treasuryATA.address,
            bot.publicKey,
            1000 * 1e6, // Amount
            6 // Decimals
        )
    );

    const sig = await connection.sendTransaction(tx, [bot]);
    console.log(`✅ Push Sent! Sig: ${sig}`);
    console.log(`WAITING for confirmation...`);
    
    await connection.confirmTransaction(sig, "confirmed");
    console.log("✅ Confirmed on-chain.");
    console.log("👉 Check Vercel Logs / Supabase now.");
}

main().catch(console.error);