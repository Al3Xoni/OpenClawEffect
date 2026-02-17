const { Connection, Keypair, clusterApiUrl } = require("@solana/web3.js");
const fs = require('fs');
const path = require('path');

async function main() {
    const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
    const keysDir = path.resolve(__dirname, "../../bots/keys");
    const files = fs.readdirSync(keysDir).filter(f => f.endsWith('.json'));

    console.log("🔍 Scanning bots for SOL...");

    for (const file of files) {
        try {
            const secretKey = Uint8Array.from(JSON.parse(fs.readFileSync(path.join(keysDir, file), 'utf-8')));
            const kp = Keypair.fromSecretKey(secretKey);
            const balance = await connection.getBalance(kp.publicKey);
            console.log(`🤖 ${file}: ${balance / 1e9} SOL`);
            
            if (balance > 0.01 * 1e9) { // Need at least 0.01 SOL
                console.log(`\n✅ FOUND SPONSOR: ${file}`);
                // Print the absolute path for easy copying
                console.log(`SPONSOR_PATH=${path.join(keysDir, file).replace(/\\/g, '/')}`);
                process.exit(0);
            }
        } catch (e) {
            console.error(`Error reading ${file}:`, e.message);
        }
    }
    console.log("❌ No rich bots found.");
}
main().catch(console.error);