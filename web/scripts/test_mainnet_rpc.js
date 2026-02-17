const { Connection, PublicKey } = require('@solana/web3.js');
const { getAssociatedTokenAddress, getAccount } = require('@solana/spl-token');

async function testMainnet() {
    const RPC_URL = "https://mainnet.helius-rpc.com/?api-key=9977b98b-1964-477d-bf5b-5d5f3bbcfeb6";
    const connection = new Connection(RPC_URL, 'confirmed');
    
    const TREASURY_ADDRESS = new PublicKey("Djnmh6umG2NuBp4XoEmZrTzgotmq3Wn1fDLwZD2bErgf");
    const SNOW_MINT = new PublicKey("BEdNRZcPzjZD7zF9zmBq986aYUrnprYE6oQ8tZoF54Zb");

    console.log("🔗 Testing Helius Mainnet RPC...");
    
    try {
        // 1. Check SOL Balance
        const solBalance = await connection.getBalance(TREASURY_ADDRESS);
        console.log(`✅ Treasury SOL Balance: ${solBalance / 1e9} SOL`);

        // 2. Check SNOW Balance
        const ata = await getAssociatedTokenAddress(SNOW_MINT, TREASURY_ADDRESS);
        try {
            const tokenAccount = await getAccount(connection, ata);
            console.log(`✅ Treasury SNOW Balance: ${Number(tokenAccount.amount) / 1e6} SNOW`);
        } catch (e) {
            console.log("⚠️ SNOW Token Account not initialized yet on Mainnet for this Treasury.");
        }

        // 3. Check Block Height
        const slot = await connection.getSlot();
        console.log(`🚀 Current Mainnet Slot: ${slot}`);
        
        console.log("\n✨ RPC is working perfectly!");
    } catch (err) {
        console.error("❌ RPC Error:", err.message);
    }
}

testMainnet();
