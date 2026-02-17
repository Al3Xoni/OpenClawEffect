const { Connection, Keypair, PublicKey, clusterApiUrl } = require("@solana/web3.js");
const { getOrCreateAssociatedTokenAccount, mintTo } = require("@solana/spl-token");
const fs = require('fs');
const path = require('path');

async function main() {
    const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
    const SNOW_MINT = new PublicKey("EDauNNfEp1QvnBamXHnMd8C8H24hXfEURW8T6DDkpump");

    // 1. Load Keys
    const mintKeyPath = path.resolve(__dirname, "../../mint_key.json");
    const mintAuthority = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(mintKeyPath, 'utf-8'))));

    const payerPath = path.resolve(__dirname, "../../bots/keys/bot_1.json");
    const payer = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(payerPath, 'utf-8'))));

    console.log(`🔧 Payer (Fees): ${payer.publicKey.toBase58()}`);
    console.log(`👑 Mint Auth: ${mintAuthority.publicKey.toBase58()}`);

    // 2. Load All Bots
    const botsDir = path.resolve(__dirname, "../../bots/keys");
    const botFiles = fs.readdirSync(botsDir).filter(f => f.endsWith('.json'));

    console.log(`
🚀 Funding ${botFiles.length} bots with 50,000 SNOW each...
`);

    for (const file of botFiles) {
        try {
            const botKey = Uint8Array.from(JSON.parse(fs.readFileSync(path.join(botsDir, file), 'utf-8')));
            const botWallet = Keypair.fromSecretKey(botKey);
            
            // Create ATA (Fee paid by Bot 1)
            const botATA = await getOrCreateAssociatedTokenAccount(
                connection,
                payer, 
                SNOW_MINT,
                botWallet.publicKey
            );

            // Mint (Auth by Master)
            const amount = 50_000 * (10 ** 6);
            await mintTo(
                connection,
                payer,      // Fee Payer
                SNOW_MINT,
                botATA.address,
                mintAuthority, // Mint Authority
                amount
            );

            console.log(`✅ Funded ${file} (${botWallet.publicKey.toBase58().slice(0,6)}...)
`);
        } catch (e) {
            console.error(`❌ Failed to fund ${file}:`, e.message);
        }
    }
    console.log("\n✨ All done!");
}

main().catch(console.error);
