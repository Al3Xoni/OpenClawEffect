const { Connection, PublicKey, Keypair } = require('@solana/web3.js');
const { getAssociatedTokenAddress, TOKEN_2022_PROGRAM_ID } = require('@solana/spl-token');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../bots/.env') });

const RPC_URL = process.env.RPC_URL;
const SNOW_MINT = new PublicKey(process.env.SNOW_MINT);

async function check() {
    console.log("🔍 Checking Bot Balances on Mainnet...");
    const connection = new Connection(RPC_URL, 'confirmed');

    const keysDir = path.join(__dirname, '../bots/keys');
    const files = fs.readdirSync(keysDir).filter(f => f.endsWith('.json'));

    console.log(`Token: ${SNOW_MINT.toBase58()}`);
    console.log("---------------------------------------------------");
    console.log("BOT NAME      | SOL BALANCE | SNOW BALANCE");
    console.log("---------------------------------------------------");

    for (const file of files) {
        const keyData = JSON.parse(fs.readFileSync(path.join(keysDir, file), 'utf-8'));
        const secret = Array.isArray(keyData) ? new Uint8Array(keyData) : new Uint8Array(Object.values(keyData));
        const kp = Keypair.fromSecretKey(secret);

        // Check SOL
        const solBalance = await connection.getBalance(kp.publicKey);
        
        // Check SNOW
        let snowBalance = 0;
        try {
            const ata = await getAssociatedTokenAddress(SNOW_MINT, kp.publicKey, false, TOKEN_2022_PROGRAM_ID);
            const bal = await connection.getTokenAccountBalance(ata);
            snowBalance = bal.value.uiAmount;
        } catch (e) {
            snowBalance = 0; // No ATA or empty
        }

        console.log(`${file.padEnd(12)} | ${(solBalance / 1e9).toFixed(4)} SOL  | ${snowBalance} SNOW`);
    }
    console.log("---------------------------------------------------");
}

check();
