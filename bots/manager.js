const { 
    Connection, 
    Keypair, 
    PublicKey, 
    SystemProgram, 
    Transaction, 
    sendAndConfirmTransaction,
    ComputeBudgetProgram
} = require('@solana/web3.js');
const { 
    getAssociatedTokenAddress, 
    createAssociatedTokenAccountInstruction, 
    createTransferInstruction,
    getAccount
} = require('@solana/spl-token');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const bs58 = require('bs58');

// --- CONFIG ---
const BOT_COUNT = 10;
const SOL_FOR_BOTS = 0.05 * 10**9; // 0.05 SOL each
const SNOW_FOR_BOTS = 50000 * 10**6; // 50k SNOW each
const KEY_PATH = path.join(__dirname, 'keys');

if (!fs.existsSync(KEY_PATH)) fs.mkdirSync(KEY_PATH);

async function manageBots() {
    const connection = new Connection(process.env.RPC_URL, 'confirmed');
    
    // Load Master Wallet
    let keyString = process.env.MASTER_WALLET_PRIVATE_KEY.trim();
    // Remove quotes if present
    keyString = keyString.replace(/^["']|["']$/g, "").trim();
    
    const masterKeypair = Keypair.fromSecretKey(
        bs58.decode(keyString)
    );
    console.log(`🏦 Master Wallet Loaded: ${masterKeypair.publicKey.toBase58()}`);

    const snowMint = new PublicKey(process.env.SNOW_MINT);
    const masterSnowATA = await getAssociatedTokenAddress(snowMint, masterKeypair.publicKey);

    for (let i = 1; i <= BOT_COUNT; i++) {
        const keyFile = path.join(KEY_PATH, `bot_${i}.json`);
        let botKeypair;

        if (fs.existsSync(keyFile)) {
            const secret = JSON.parse(fs.readFileSync(keyFile));
            botKeypair = Keypair.fromSecretKey(Uint8Array.from(secret));
        } else {
            botKeypair = Keypair.generate();
            fs.writeFileSync(keyFile, JSON.stringify(Array.from(botKeypair.secretKey)));
            console.log(`🆕 Generated Bot ${i}: ${botKeypair.publicKey.toBase58()}`);
        }

        const botPubkey = botKeypair.publicKey;

        // 1. Check SOL Balance
        const solBalance = await connection.getBalance(botPubkey);
        if (solBalance < 0.01 * 10**9) {
            console.log(`⛽ Funding Bot ${i} with SOL...`);
            const tx = new Transaction().add(
                SystemProgram.transfer({
                    fromPubkey: masterKeypair.publicKey,
                    toPubkey: botPubkey,
                    lamports: SOL_FOR_BOTS,
                })
            );
            await sendAndConfirmTransaction(connection, tx, [masterKeypair]);
        }

        // 2. Check SNOW Balance
        const botSnowATA = await getAssociatedTokenAddress(snowMint, botPubkey);
        try {
            const account = await getAccount(connection, botSnowATA);
            if (Number(account.amount) < 5000 * 10**6) {
                console.log(`❄️ Refilling Bot ${i} with SNOW...`);
                const tx = new Transaction().add(
                    createTransferInstruction(
                        masterSnowATA,
                        botSnowATA,
                        masterKeypair.publicKey,
                        SNOW_FOR_BOTS
                    )
                );
                await sendAndConfirmTransaction(connection, tx, [masterKeypair]);
            }
        } catch (e) {
            console.log(`✨ Creating ATA & Funding Bot ${i} with SNOW...`);
            const tx = new Transaction().add(
                createAssociatedTokenAccountInstruction(
                    masterKeypair.publicKey,
                    botSnowATA,
                    botPubkey,
                    snowMint
                ),
                createTransferInstruction(
                    masterSnowATA,
                    botSnowATA,
                    masterKeypair.publicKey,
                    SNOW_FOR_BOTS
                )
            );
            await sendAndConfirmTransaction(connection, tx, [masterKeypair]);
        }
    }
    console.log("✅ All bots are ready and funded!");
}

manageBots().catch(console.error);
