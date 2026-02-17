const { Connection, Keypair, PublicKey, clusterApiUrl } = require("@solana/web3.js");
const { getMint, getAssociatedTokenAddress, getAccount, createAssociatedTokenAccount, mintTo } = require("@solana/spl-token");
const fs = require('fs');
const path = require('path');

async function main() {
    const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
    console.log("🔌 Connected to Devnet");
    
    // 1. Load the "Mint Authority" Wallet
    const keyPath = path.resolve(__dirname, "../../mint_key.json");
    if (!fs.existsSync(keyPath)) {
        console.error("❌ mint_key.json not found!");
        return;
    }
    const secretKey = Uint8Array.from(JSON.parse(fs.readFileSync(keyPath, 'utf-8')));
    const payer = Keypair.fromSecretKey(secretKey);
    console.log(`🔑 Authority/Payer: ${payer.publicKey.toBase58()}`);

    // 2. Check Balance
    const balance = await connection.getBalance(payer.publicKey);
    console.log(`💰 Balance: ${balance / 1e9} SOL`);
    if (balance < 1 * 1e9) { 
        console.log("💧 Requesting Airdrop of 2 SOL...");
        try {
            const signature = await connection.requestAirdrop(payer.publicKey, 2 * 1e9);
            const latestBlockHash = await connection.getLatestBlockhash();
            await connection.confirmTransaction({
                blockhash: latestBlockHash.blockhash,
                lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
                signature: signature
            });
            console.log("✅ Airdrop Received!");
        } catch (e) {
            console.error("❌ Airdrop Failed (Rate limited?):", e.message);
            console.log("👉 Please fund this wallet manually: " + payer.publicKey.toBase58());
            // Attempt to continue anyway, in case 0 SOL was a display glitch or tiny amount exists
        }
    }

    const MINT_ADDRESS = new PublicKey("EDauNNfEp1QvnBamXHnMd8C8H24hXfEURW8T6DDkpump");
    const TREASURY = new PublicKey("Djnmh6umG2NuBp4XoEmZrTzgotmq3Wn1fDLwZD2bErgf");

    // 3. Check Mint
    try {
        const mintInfo = await getMint(connection, MINT_ADDRESS);
        console.log(`✅ Mint Found! Supply: ${Number(mintInfo.supply)}`);
        console.log(`   Mint Authority: ${mintInfo.mintAuthority?.toBase58()}`);
        if (mintInfo.mintAuthority?.toBase58() !== payer.publicKey.toBase58()) {
            console.error("❌ ERROR: Loaded Key is NOT the Mint Authority!");
            return;
        }
    } catch (e) {
        console.error("❌ Mint Not Found or Error:", e.message);
        return;
    }

    // 4. Check ATA
    const ata = await getAssociatedTokenAddress(MINT_ADDRESS, TREASURY);
    console.log(`📍 Treasury ATA should be: ${ata.toBase58()}`);

    let needsCreation = false;
    try {
        const accountInfo = await getAccount(connection, ata);
        console.log(`✅ ATA Exists. Balance: ${Number(accountInfo.amount)}`);
    } catch (e) {
        if (e.name === "TokenAccountNotFoundError") {
            console.log("ℹ️ ATA does not exist. Attempting creation...");
            needsCreation = true;
        } else {
            console.error("❌ Error checking ATA:", e);
            return;
        }
    }

    // 5. Create if needed
    if (needsCreation) {
        try {
            const newAta = await createAssociatedTokenAccount(
                connection,
                payer,
                MINT_ADDRESS,
                TREASURY
            );
            console.log(`✅ ATA Created at: ${newAta.toBase58()}`);
        } catch (e) {
            console.error("❌ Failed to create ATA:", e);
            return;
        }
    }

    // 6. Mint
    console.log("🏭 Attempting to Mint 50,000 SNOW...");
    try {
        const amount = 50_000 * (10 ** 6);
        const sig = await mintTo(
            connection,
            payer,
            MINT_ADDRESS,
            ata,
            payer,
            amount
        );
        console.log(`✅ Mint Success! Sig: ${sig}`);
    } catch (e) {
        console.error("❌ Mint Failed:", e);
    }
}

main().catch(err => console.error(err));