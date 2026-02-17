const { Connection } = require('@solana/web3.js');

async function testVerification() {
    const RPC_URL = "https://api.mainnet-beta.solana.com"; 
    const TREASURY_WALLET = "Djnmh6umG2NuBp4XoEmZrTzgotmq3Wn1fDLwZD2bErgf";
    const SNOW_MINT = "EDauNNfEp1QvnBamXHnMd8C8H24hXfEURW8T6DDkpump";
    const signature = "5ompXojdaFTTUY9rYNeDFNJ7S2xCBpjQWFaea2NSjRmAJTf126qXax9BiohKv8owzE76d61rasG6qY2BCXfk46Zq";

    console.log(`🔍 Checking TX: ${signature}`);
    const connection = new Connection(RPC_URL, 'confirmed');

    try {
        const tx = await connection.getParsedTransaction(signature, {
            maxSupportedTransactionVersion: 0,
            commitment: 'confirmed'
        });

        if (!tx) {
            console.log("❌ Transaction not found via RPC.");
            return;
        }

        console.log("✅ Transaction found!");
        
        const postBalances = tx.meta.postTokenBalances || [];
        console.log(`📊 Post Balances: ${postBalances.length} items`);

        postBalances.forEach((b, i) => {
            console.log(`   [${i}] Owner: ${b.owner} | Mint: ${b.mint} | Amount: ${b.uiTokenAmount.amount}`);
        });

        const validTransfer = postBalances.find(b => 
            b.owner === TREASURY_WALLET && 
            b.mint === SNOW_MINT
        );

        if (validTransfer) {
            console.log("\n🎉 SUCCESS: Valid transfer detected!");
        } else {
            console.log("\n❌ FAILURE: No matching balance found for Treasury+Mint.");
        }

    } catch (e) {
        console.error("❌ ERROR:", e);
    }
}

testVerification();
