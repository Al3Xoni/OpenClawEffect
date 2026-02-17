const { 
    Connection, 
    Keypair, 
    PublicKey, 
    Transaction, 
    sendAndConfirmTransaction 
} = require('@solana/web3.js');
const { 
    getAssociatedTokenAddress, 
    createAssociatedTokenAccountInstruction, 
    TOKEN_2022_PROGRAM_ID 
} = require('@solana/spl-token');
const bs58 = require('bs58');
require('dotenv').config({ path: './web/.env.local' });

async function fixTreasury() {
    const connection = new Connection(process.env.NEXT_PUBLIC_RPC_URL, 'confirmed');
    const treasuryWallet = new PublicKey(process.env.NEXT_PUBLIC_TREASURY_ADDRESS);
    const mint = new PublicKey(process.env.NEXT_PUBLIC_SNOW_MINT);
    
    // Use your Master Key to pay for the account creation
    const payer = Keypair.fromSecretKey(bs58.decode(process.env.TREASURY_PRIVATE_KEY));

    console.log("Fixing Treasury ATA for Token-2022...");

    const treasuryATA = await getAssociatedTokenAddress(
        mint,
        treasuryWallet,
        true,
        TOKEN_2022_PROGRAM_ID
    );

    const tx = new Transaction().add(
        createAssociatedTokenAccountInstruction(
            payer.publicKey,
            treasuryATA,
            treasuryWallet,
            mint,
            TOKEN_2022_PROGRAM_ID
        )
    );

    try {
        const sig = await sendAndConfirmTransaction(connection, tx, [payer]);
        console.log("✅ Treasury ATA Created! Sig:", sig);
    } catch (e) {
        console.log("⚠️ Account might already exist or error:", e.message);
    }
}

fixTreasury();
