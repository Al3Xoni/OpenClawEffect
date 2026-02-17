const { 
    Connection, 
    Keypair, 
    PublicKey, 
    Transaction,
    ComputeBudgetProgram,
    SystemProgram
} = require('@solana/web3.js');
const { 
    getAssociatedTokenAddress, 
    createTransferCheckedInstruction,
    createAssociatedTokenAccountIdempotentInstruction,
    getAccount,
    TOKEN_2022_PROGRAM_ID
} = require('@solana/spl-token');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// --- CONSTANTS ---
const KEY_PATH = path.join(__dirname, 'keys');
const PUSH_COST = 100000;
const DECIMALS = 6; 
const SNOW_MINT = new PublicKey(process.env.SNOW_MINT);
const TREASURY_WALLET = new PublicKey(process.env.TREASURY_ADDRESS);

async function play() {
    const connection = new Connection(process.env.RPC_URL, 'confirmed');

    console.log("🚀 Starting Bot Farm (Mainnet - Token2022 Mode)...");
    console.log(`Treasury Target: ${TREASURY_WALLET.toBase58()}`);

    // Pre-calculate Treasury ATA with Token-2022
    const treasuryATA = await getAssociatedTokenAddress(SNOW_MINT, TREASURY_WALLET, true, TOKEN_2022_PROGRAM_ID);

    while (true) {
        // 1. Pick a random bot
        const files = fs.readdirSync(KEY_PATH).filter(f => f.endsWith('.json'));
        const randomFile = files[Math.floor(Math.random() * files.length)];
        const secretData = JSON.parse(fs.readFileSync(path.join(KEY_PATH, randomFile)));
        
        // Handle different key formats
        const secret = Array.isArray(secretData) ? new Uint8Array(secretData) : new Uint8Array(Object.values(secretData));
        const botKeypair = Keypair.fromSecretKey(secret);

        console.log(`\n🤖 Bot ${botKeypair.publicKey.toBase58().slice(0, 8)}... is active.`);

        // 2. Build Transaction
        try {
            const botSnowATA = await getAssociatedTokenAddress(SNOW_MINT, botKeypair.publicKey, false, TOKEN_2022_PROGRAM_ID);
            
            // Check Balance first
            try {
                const bal = await connection.getTokenAccountBalance(botSnowATA);
                if (!bal.value.uiAmount || bal.value.uiAmount < PUSH_COST) {
                    console.log("⚠️ Bot out of SNOW. Skipping.");
                    continue;
                }
            } catch(e) {
                console.log("⚠️ Bot has no SNOW account or is empty. Skipping.");
                continue;
            }

            const tx = new Transaction();
            
            // Priority Fees (Higher for Mainnet)
            tx.add(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 150000 }));

            // Ensure Treasury ATA exists (Idempotent)
            tx.add(
                createAssociatedTokenAccountIdempotentInstruction(
                    botKeypair.publicKey,
                    treasuryATA,
                    TREASURY_WALLET,
                    SNOW_MINT,
                    TOKEN_2022_PROGRAM_ID
                )
            );

            // Add Transfer Instruction (Token-2022)
            const transferIx = createTransferCheckedInstruction(
                botSnowATA,         
                SNOW_MINT,          
                treasuryATA,        
                botKeypair.publicKey, 
                PUSH_COST * (10 ** DECIMALS), 
                DECIMALS,
                [],
                TOKEN_2022_PROGRAM_ID
            );

            tx.add(transferIx);

            const { blockhash } = await connection.getLatestBlockhash('finalized');
            tx.recentBlockhash = blockhash;
            tx.feePayer = botKeypair.publicKey;
            tx.sign(botKeypair);

            const signature = await connection.sendRawTransaction(tx.serialize(), {
                skipPreflight: true,
                maxRetries: 2
            });
            console.log(`❄️ PUSH SENT! Sig: ${signature}`);

            // --- NOTIFY BACKEND MANUALLY ---
            try {
                console.log("📡 Notifying backend...");
                const verifyUrl = 'https://openclawball.fun/api/verify-push';
                const response = await fetch(verifyUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ signature })
                });
                
                if (response.ok) {
                    console.log(`✅ UI Updated Successfully`);
                } else {
                    const errText = await response.text();
                    console.warn(`⚠️ UI Update Failed: ${response.status} - ${errText}`);
                }
            } catch (apiErr) {
                console.error(`❌ API Network Error:`, apiErr.message);
            }
            // -------------------------------
            
        } catch (e) {
            console.error(`❌ Bot Push Error:`, e.message);
        }

        // 3. Wait random time (70 to 78 minutes for late-round pressure)
        const waitTime = Math.floor(Math.random() * (4680000 - 4200000) + 4200000);
        console.log(`Sleeping ${Math.floor(waitTime/60000)} minutes...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
    }
}

play().catch(console.error);