const { Connection, PublicKey } = require('@solana/web3.js');

async function findCurve() {
    // Folosim RPC-ul public pentru asta
    const connection = new Connection("https://api.mainnet-beta.solana.com");
    const SNOW_MINT = "EDauNNfEp1QvnBamXHnMd8C8H24hXfEURW8T6DDkpump";
    const PUMP_PROGRAM = new PublicKey("6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P");

    console.log("🔍 Searching for Bonding Curve Account...");

    // Bonding curve este un PDA derivat din Mint și Program ID
    // SEED: ["bonding-curve", mint_pubkey]
    const [curvePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("bonding-curve"), new PublicKey(SNOW_MINT).toBuffer()],
        PUMP_PROGRAM
    );

    console.log(`\n🎯 Bonding Curve Address: ${curvePda.toBase58()}`);
    console.log("   (Add this to liquidity-manager/.env as BONDING_CURVE)\n");
    
    // Verificăm dacă există contul (dacă tokenul a fost migrat pe Raydium, contul s-ar putea să fie închis)
    const info = await connection.getAccountInfo(curvePda);
    if (info) {
        console.log("✅ Account exists! Still on Pump.fun.");
    } else {
        console.log("⚠️ Account NOT found! Token might have migrated to Raydium.");
    }
}

findCurve();
