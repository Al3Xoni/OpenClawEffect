const { Connection, Keypair, PublicKey, ComputeBudgetProgram, Transaction, sendAndConfirmTransaction } = require('@solana/web3.js');
const { getAssociatedTokenAddress, createAssociatedTokenAccountIdempotentInstruction, createTransferCheckedInstruction, getMint, TOKEN_2022_PROGRAM_ID } = require('@solana/spl-token');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../bots/.env') });

const RPC_URL = process.env.RPC_URL;
const SNOW_MINT = new PublicKey(process.env.SNOW_MINT);
const TREASURY_KEY_STRING = process.env.MASTER_WALLET_PRIVATE_KEY; // Treasury Key set in bots/.env

// CONFIG
const AMOUNT_PER_BOT = 20000;
const DECIMALS = 6; // Pump.fun tokens are usually 6

async function main() {
    console.log("❄️  Starting SNOW Distribution (Mainnet)...");
    
    // 1. Setup Connection & Wallet
    const connection = new Connection(RPC_URL, 'confirmed');
    const treasuryWallet = Keypair.fromSecretKey(new Uint8Array(require('bs58').decode(TREASURY_KEY_STRING)));
    console.log(`🏦 Treasury: ${treasuryWallet.publicKey.toBase58()}`);

    // 2. Load Bots
    const bots = [];
    const keysDir = path.join(__dirname, '../bots/keys');
    const files = fs.readdirSync(keysDir).filter(f => f.endsWith('.json'));

    for (const file of files) {
        const keyData = JSON.parse(fs.readFileSync(path.join(keysDir, file), 'utf-8'));
        // Handle different key formats (array or secretKey property)
        const secretKey = Array.isArray(keyData) ? new Uint8Array(keyData) : new Uint8Array(Object.values(keyData));
        const kp = Keypair.fromSecretKey(secretKey);
        bots.push({ name: file, publicKey: kp.publicKey });
    }
    console.log(`🤖 Found ${bots.length} bots.`);

    // 3. Get Treasury ATA
    const treasuryATA = await getAssociatedTokenAddress(SNOW_MINT, treasuryWallet.publicKey, false, TOKEN_2022_PROGRAM_ID);
    
    // Check Treasury Balance
    try {
        const balance = await connection.getTokenAccountBalance(treasuryATA);
        console.log(`💰 Treasury Balance: ${balance.value.uiAmount} SNOW`);
        if (balance.value.uiAmount < bots.length * AMOUNT_PER_BOT) {
            console.error("❌ Not enough SNOW in Treasury!");
            return;
        }
    } catch (e) {
        console.error("❌ Error fetching treasury balance. Make sure Treasury has initialized ATA.");
        return;
    }

    // 4. Distribute
    console.log(`🚀 Sending ${AMOUNT_PER_BOT} SNOW to ${bots.length} bots...`);

    for (const bot of bots) {
        try {
            const transaction = new Transaction();
            
            // Priority Fee
            transaction.add(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 100000 }));

            const botATA = await getAssociatedTokenAddress(SNOW_MINT, bot.publicKey, false, TOKEN_2022_PROGRAM_ID);

            // Create ATA if missing (Idempotent)
            transaction.add(
                createAssociatedTokenAccountIdempotentInstruction(
                    treasuryWallet.publicKey, // Payer
                    botATA,
                    bot.publicKey,
                    SNOW_MINT,
                    TOKEN_2022_PROGRAM_ID
                )
            );

            // Transfer
            transaction.add(
                createTransferCheckedInstruction(
                    treasuryATA,
                    SNOW_MINT,
                    botATA,
                    treasuryWallet.publicKey,
                    AMOUNT_PER_BOT * (10 ** DECIMALS),
                    DECIMALS,
                    [],
                    TOKEN_2022_PROGRAM_ID
                )
            );

            const signature = await sendAndConfirmTransaction(connection, transaction, [treasuryWallet], { skipPreflight: true });
            console.log(`✅ Sent to ${bot.name} (${bot.publicKey.toBase58().slice(0,6)}...): ${signature}`);

        } catch (err) {
            console.error(`❌ Failed to send to ${bot.name}:`, err.message);
        }
    }

    console.log("🏁 Distribution Complete.");
}

main();
