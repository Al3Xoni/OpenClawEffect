const { Connection, Keypair, clusterApiUrl } = require("@solana/web3.js");
const { createMint, getOrCreateAssociatedTokenAccount, mintTo } = require("@solana/spl-token");
const fs = require("fs");

async function main() {
    const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
    console.log("🔌 Connected to Devnet");

    // Static key so we can fund it manually if needed
    const secretKey = new Uint8Array([71,215,166,120,211,2,27,44,152,150,246,194,34,182,168,106,80,18,162,201,3,20,221,166,139,26,169,21,66,51,137,17,78,68,150,204,123,240,48,134,172,233,15,214,218,149,54,16,194,249,244,134,185,59,102,36,168,246,242,98,157,100,31,203]);
    const payer = Keypair.fromSecretKey(secretKey);
    
    console.log(`🔑 Using Wallet: ${payer.publicKey.toBase58()}`);

    const balance = await connection.getBalance(payer.publicKey);
    console.log(`💰 Current Balance: ${balance / 10**9} SOL`);

    if (balance < 0.01 * 10**9) {
        console.log("❌ Insufficient SOL. Please fund the wallet above via https://faucet.solana.com");
        return;
    }

    console.log("\n✨ Creating Token Mint (6 decimals)...");
    const mint = await createMint(
        connection,
        payer,
        payer.publicKey,
        payer.publicKey,
        6
    );

    console.log(`\n✅ TOKEN CREATED!`);
    console.log(`📜 Mint Address: ${mint.toBase58()}`);

    console.log("\n📦 Creating Token Account...");
    const tokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        payer,
        mint,
        payer.publicKey
    );

    console.log("💸 Minting 1,000,000 SNOW...");
    await mintTo(
        connection,
        payer,
        mint,
        tokenAccount.address,
        payer,
        1_000_000 * (10 ** 6)
    );

    console.log(`🎉 Done!`);
    console.log(`\nNEXT_PUBLIC_SNOW_MINT=${mint.toBase58()}`);
}

main().catch(err => console.error(err));