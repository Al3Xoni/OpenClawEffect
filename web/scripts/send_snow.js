const { Connection, Keypair, PublicKey, clusterApiUrl } = require("@solana/web3.js");
const { getOrCreateAssociatedTokenAccount, mintTo } = require("@solana/spl-token");
const fs = require('fs');
const path = require('path');

async function main() {
    const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
    
    // 1. Load the "Mint Authority" (Signer for Minting)
    const authorityPath = path.resolve(__dirname, "../../mint_key.json");
    const authoritySecret = Uint8Array.from(JSON.parse(fs.readFileSync(authorityPath, 'utf-8')));
    const mintAuthority = Keypair.fromSecretKey(authoritySecret);

    // 2. Load the "Payer" (Sponsor for Fees) - Bot 1
    const payerPath = path.resolve(__dirname, "../../bots/keys/bot_1.json");
    const payerSecret = Uint8Array.from(JSON.parse(fs.readFileSync(payerPath, 'utf-8')));
    const payer = Keypair.fromSecretKey(payerSecret);

    const MINT_ADDRESS = new PublicKey("EDauNNfEp1QvnBamXHnMd8C8H24hXfEURW8T6DDkpump"); // New SNOW Mint
    const RECIPIENT_ADDRESS = new PublicKey("Djnmh6umG2NuBp4XoEmZrTzgotmq3Wn1fDLwZD2bErgf"); // Treasury Wallet

    console.log(`Payer: ${payer.publicKey.toBase58()} | Balance: ${(await connection.getBalance(payer.publicKey))/1e9} SOL`);
    console.log(`Authority: ${mintAuthority.publicKey.toBase58()}`);
    console.log(`🏭 Minting SNOW to Treasury ${RECIPIENT_ADDRESS.toBase58()}...`);

    // 3. Get/Create Recipient Token Account (Treasury ATA)
    const recipientATA = await getOrCreateAssociatedTokenAccount(
        connection,
        payer, // PAYER (Bot 1)
        MINT_ADDRESS,
        RECIPIENT_ADDRESS
    );

    // 4. Mint 50,000 SNOW
    const amount = 50_000 * (10 ** 6);
    
    const signature = await mintTo(
        connection,
        payer, // PAYER (Bot 1)
        MINT_ADDRESS,
        recipientATA.address, // Destination
        mintAuthority, // Authority (Mint Key)
        amount
    );

    console.log(`✅ Minted 50,000 SNOW to Treasury!`);
    console.log(`🔗 TX: https://explorer.solana.com/tx/${signature}?cluster=devnet`);
}

main().catch(err => console.error(err));
