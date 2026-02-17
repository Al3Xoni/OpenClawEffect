const { 
    Connection, 
    Keypair, 
    PublicKey, 
    Transaction, 
    TransactionInstruction, 
    sendAndConfirmTransaction 
} = require('@solana/web3.js');
const bs58 = require('bs58');
const { sha256 } = require('js-sha256');
require('dotenv').config();

// --- CONFIGURATION ---
// 1. The Bot Wallet Address you want to authorize
// Replace this with the Public Key of your Liquidity Manager Bot if it's different from Admin.
// If you are running the bot with the same wallet as the deployer, you don't actually need to run this.
const BOT_WALLET_PUBKEY = "CCxBFjohSTWpLAtTG7KGJTTnafSibsata4N2JhBftJNx"; 

async function authorizeBot() {
    console.log("🔐 Authorizing Liquidity Manager...");

    const connection = new Connection(process.env.RPC_URL, 'confirmed');
    
    // 1. Load Admin (Deployer) Wallet
    let keyString = process.env.MASTER_WALLET_PRIVATE_KEY.trim().replace(/^["']|["']$/g, "").trim();
    const adminKeypair = Keypair.fromSecretKey(bs58.decode(keyString));
    console.log(`👤 Admin Authority: ${adminKeypair.publicKey.toBase58()}`);

    // 2. Derive Game State PDA
    const programId = new PublicKey(process.env.PROGRAM_ID);
    const [gameStatePda] = PublicKey.findProgramAddressSync(
        [Buffer.from(process.env.GAME_STATE_SEED || "game_v4")],
        programId
    );
    console.log(`zk Game State PDA: ${gameStatePda.toBase58()}`);

    // 3. Calculate Instruction Discriminator for "global:set_liquidity_manager"
    // Anchor uses sha256("global:snake_case_name")[0..8]
    const discriminator = Buffer.from(sha256.digest("global:set_liquidity_manager")).slice(0, 8);

    // 4. Encode Instruction Data (Discriminator + Pubkey)
    const botPubkey = new PublicKey(BOT_WALLET_PUBKEY);
    const data = Buffer.concat([
        discriminator,
        botPubkey.toBuffer()
    ]);

    // 5. Build Transaction
    const ix = new TransactionInstruction({
        keys: [
            { pubkey: gameStatePda, isSigner: false, isWritable: true },
            { pubkey: adminKeypair.publicKey, isSigner: true, isWritable: true },
        ],
        programId: programId,
        data: data,
    });

    const tx = new Transaction().add(ix);

    try {
        const sig = await sendAndConfirmTransaction(connection, tx, [adminKeypair]);
        console.log(`✅ Success! Bot Authorized.`);
        console.log(`🆔 Manager: ${BOT_WALLET_PUBKEY}`);
        console.log(`explorer.solana.com/tx/${sig}?cluster=devnet`); // Change cluster if mainnet
    } catch (e) {
        console.error("❌ Failed to authorize bot:");
        console.error(e);
    }
}

authorizeBot();
