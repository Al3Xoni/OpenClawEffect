const { 
    Connection, 
    Keypair, 
    PublicKey, 
    Transaction,
    ComputeBudgetProgram
} = require('@solana/web3.js');
const { 
    getAssociatedTokenAddress, 
    createTransferCheckedInstruction,
    createAssociatedTokenAccountIdempotentInstruction,
    TOKEN_2022_PROGRAM_ID
} = require('@solana/spl-token');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const PUSH_COST = 100000;
const DECIMALS = 6; 
const SNOW_MINT = new PublicKey(process.env.SNOW_MINT);
const TREASURY_WALLET = new PublicKey(process.env.TREASURY_ADDRESS);

async function testSinglePush() {
    const connection = new Connection(process.env.RPC_URL, 'confirmed');
    
    const botKeyFile = path.join(__dirname, 'keys', 'bot_1.json');
    const secretData = JSON.parse(fs.readFileSync(botKeyFile));
    const secret = Array.isArray(secretData) ? new Uint8Array(secretData) : new Uint8Array(Object.values(secretData));
    const botKeypair = Keypair.fromSecretKey(secret);

    console.log(`🚀 FORCING AGGRESSIVE PUSH from Bot 1: ${botKeypair.publicKey.toBase58()}`);

    try {
        const botSnowATA = await getAssociatedTokenAddress(SNOW_MINT, botKeypair.publicKey, false, TOKEN_2022_PROGRAM_ID);
        const treasuryATA = await getAssociatedTokenAddress(SNOW_MINT, TREASURY_WALLET, true, TOKEN_2022_PROGRAM_ID);

        const tx = new Transaction();
        // MASSIVE PRIORITY FEE for testing
        tx.add(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 3000000 })); 

        tx.add(
            createAssociatedTokenAccountIdempotentInstruction(
                botKeypair.publicKey,
                treasuryATA,
                TREASURY_WALLET,
                SNOW_MINT,
                TOKEN_2022_PROGRAM_ID
            )
        );

        tx.add(
            createTransferCheckedInstruction(
                botSnowATA,         
                SNOW_MINT,          
                treasuryATA,        
                botKeypair.publicKey, 
                PUSH_COST * (10 ** DECIMALS), 
                DECIMALS,
                [],
                TOKEN_2022_PROGRAM_ID
            )
        );

        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
        tx.recentBlockhash = blockhash;
        tx.feePayer = botKeypair.publicKey;
        tx.sign(botKeypair);

        const rawTransaction = tx.serialize();
        
        console.log("Sending and confirming transaction (High Priority)...");
        const signature = await connection.sendRawTransaction(rawTransaction, {
            skipPreflight: true,
            maxRetries: 5
        });
        
        console.log(`❄️ Signature: ${signature}`);
        
        // Wait for confirmation
        const confirmation = await connection.confirmTransaction({
            signature,
            blockhash,
            lastValidBlockHeight
        }, 'confirmed');

        if (confirmation.value.err) {
            console.error("❌ Transaction failed in block:", confirmation.value.err);
        } else {
            console.log("✅ TRANSACTION SUCCESSFUL!");
            
            // Notify UI
            const verifyUrl = 'https://openclawball.fun/api/verify-push';
            await fetch(verifyUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ signature })
            });
            console.log("📡 UI Notified.");
        }

    } catch (e) {
        console.error("❌ Error:", e.message);
    }
}

testSinglePush();
