const { Connection, Keypair, PublicKey, VersionedTransaction } = require('@solana/web3.js');
const { getAssociatedTokenAddress, getAccount } = require('@solana/spl-token');
const bs58 = require('bs58');
const dotenv = require('dotenv');
const path = require('path');

// Load ENV from liquidity-manager/.env
dotenv.config({ path: path.resolve(__dirname, '../../liquidity-manager/.env') });

const RPC_URL = process.env.RPC_URL || "https://ethelind-zpmkg8-fast-mainnet.helius-rpc.com";
const TREASURY_KEY = process.env.TREASURY_PRIVATE_KEY;
const SNOW_MINT = new PublicKey(process.env.SNOW_MINT);

async function forceSwap() {
    if (!TREASURY_KEY || TREASURY_KEY.includes("REPLACE")) {
        console.error("❌ ERROR: Please put your Treasury Private Key in liquidity-manager/.env");
        process.exit(1);
    }

    const connection = new Connection(RPC_URL, 'confirmed');
    const decode = bs58.decode || bs58.default?.decode;
    const payer = Keypair.fromSecretKey(decode(TREASURY_KEY));
    
    console.log(`🚀 Starting Force Swap for Treasury: ${payer.publicKey.toBase58()}`);

    try {
        // 1. Get SNOW Balance
        const ata = await getAssociatedTokenAddress(SNOW_MINT, payer.publicKey, false, new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"));
        const tokenAccount = await getAccount(connection, ata, 'confirmed', new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"));
        const amount = tokenAccount.amount;

        if (amount === 0n) {
            console.log("⚠️ No SNOW tokens to sell.");
            return;
        }

        console.log(`💰 Found ${Number(amount) / 1e6} SNOW. Fetching quote from Jupiter...`);

        // 2. Get Quote from Jupiter API (Best for Mainnet swaps)
        const quoteResponse = await fetch(`https://quote-api.jup.ag/v6/quote?inputMint=${SNOW_MINT.toBase58()}&outputMint=So11111111111111111111111111111111111111112&amount=${amount}&slippageBps=500`)
            .then(res => res.json());

        if (quoteResponse.error) {
            throw new Error(`Jupiter Quote Error: ${JSON.stringify(quoteResponse.error)}`);
        }

        console.log(`📈 Expected SOL Out: ${quoteResponse.outAmount / 1e9} SOL`);

        // 3. Get Swap Transaction
        const { swapTransaction } = await fetch('https://quote-api.jup.ag/v6/swap', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                quoteResponse,
                userPublicKey: payer.publicKey.toBase58(),
                wrapAndUnwrapSol: true,
                prioritizationFeeLamports: 100000 // Priority fee for Mainnet
            })
        }).then(res => res.json());

        // 4. Sign and Send
        const swapTransactionBuf = Buffer.from(swapTransaction, 'base64');
        const transaction = VersionedTransaction.deserialize(swapTransactionBuf);
        transaction.sign([payer]);

        const signature = await connection.sendRawTransaction(transaction.serialize(), {
            skipPreflight: true,
            maxRetries: 2
        });

        console.log(`✅ Swap Sent! TX: https://solscan.io/tx/${signature}`);
        console.log("⏳ Waiting for confirmation...");
        
        await connection.confirmTransaction(signature, 'confirmed');
        console.log("✨ Swap Confirmed! Treasury now has SOL.");

    } catch (err) {
        console.error("❌ Swap Failed:", err.message);
    }
}

forceSwap();
