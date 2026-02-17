import { Connection, PublicKey, TransactionInstruction, Transaction, SystemProgram, ComputeBudgetProgram } from "@solana/web3.js";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { sha256 } from "js-sha256";
import { 
    TOKEN_PROGRAM_ID, 
    ASSOCIATED_TOKEN_PROGRAM_ID,
    getAssociatedTokenAddress, 
    createAssociatedTokenAccountInstruction 
} from "@solana/spl-token";

// --- CONSTANTS ---
// PRIORITY: Environment Variables (Mainnet) -> Hardcoded Fallbacks (Devnet)
const PROGRAM_ID_STRING = process.env.NEXT_PUBLIC_PROGRAM_ID || "HFn2E5EV2MyUw42n2ZENx8btzeKBeQ9aDyo9GRQQ9ebs";
const SNOW_MINT_STRING = process.env.NEXT_PUBLIC_SNOW_MINT || "EDauNNfEp1QvnBamXHnMd8C8H24hXfEURW8T6DDkpump";

export class SnowballClient {
    connection: Connection;
    wallet: WalletContextState;
    programId: PublicKey;

    constructor(connection: Connection, wallet: WalletContextState) {
        this.connection = connection;
        this.wallet = wallet;
        this.programId = new PublicKey(PROGRAM_ID_STRING);
    }

    // --- HELPER: Compute Discriminator (Function Signature) ---
    getDiscriminator(namespace: string, name: string): Buffer {
        const preimage = `${namespace}:${name}`;
        const hash = sha256.digest(preimage);
        return Buffer.from(hash.slice(0, 8));
    }

    getGameStatePDA(): PublicKey {
        const [pda] = PublicKey.findProgramAddressSync(
            [new TextEncoder().encode("game_v4")],
            this.programId
        );
        return pda;
    }

    // --- MAIN FUNCTIONS ---

    async initializeGame() {
        if (!this.wallet.publicKey || !this.wallet.signTransaction) throw new Error("Wallet not connected");

        const gameStatePDA = this.getGameStatePDA();
        console.log("Initializing Game PDA (v3):", gameStatePDA.toBase58());

        // 1. Calculate Discriminator for 'initialize_game'
        const discriminator = this.getDiscriminator("global", "initialize_game");

        // 2. Build Instruction
        const ix = new TransactionInstruction({
            keys: [
                { pubkey: gameStatePDA, isSigner: false, isWritable: true },
                { pubkey: this.wallet.publicKey, isSigner: true, isWritable: true },
                { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }, // System Program
            ],
            programId: this.programId,
            data: discriminator,
        });

        // 3. Send Transaction
        return await this.sendAndConfirm([ix]);
    }

    async pushSnowball() {
        if (!this.wallet.publicKey) throw new Error("Wallet not connected");

        const gameStatePDA = this.getGameStatePDA();
        const mint = new PublicKey(SNOW_MINT_STRING);
        
        // Calculate ATAs
        const userSnowAccount = await getAssociatedTokenAddress(mint, this.wallet.publicKey);
        const gameSnowVault = await getAssociatedTokenAddress(mint, gameStatePDA, true);

        const instructions: TransactionInstruction[] = [];

        // --- AUTO-INIT VAULT CHECK ---
        const vaultInfo = await this.connection.getAccountInfo(gameSnowVault);
        if (!vaultInfo) {
            console.log("Game Vault not found. Creating it now...");
            const createVaultIx = createAssociatedTokenAccountInstruction(
                this.wallet.publicKey, // Payer
                gameSnowVault,         // Associated Token Account
                gameStatePDA,          // Owner (The Game PDA)
                mint                   // Mint
            );
            instructions.push(createVaultIx);
        }

        console.log("Pushing on v3...");

        // 1. Calculate Discriminator for 'push_ball'
        const discriminator = this.getDiscriminator("global", "push_ball");

        // 2. Build Push Instruction
        const pushIx = new TransactionInstruction({
            keys: [
                { pubkey: gameStatePDA, isSigner: false, isWritable: true },
                { pubkey: this.wallet.publicKey, isSigner: true, isWritable: true },
                { pubkey: userSnowAccount, isSigner: false, isWritable: true },
                { pubkey: gameSnowVault, isSigner: false, isWritable: true },
                { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
            ],
            programId: this.programId,
            data: discriminator,
        });
        instructions.push(pushIx);

        // 3. Send Transaction
        return await this.sendAndConfirm(instructions);
    }

    async resetGame() {
        if (!this.wallet.publicKey) throw new Error("Wallet not connected");

        const gameStatePDA = this.getGameStatePDA();
        console.log("Resetting Game PDA (v3)...");

        // 1. Calculate Discriminator for 'reset_game'
        const discriminator = this.getDiscriminator("global", "reset_game");

        // 2. Build Instruction
        const ix = new TransactionInstruction({
            keys: [
                { pubkey: gameStatePDA, isSigner: false, isWritable: true },
                { pubkey: this.wallet.publicKey, isSigner: true, isWritable: true }, // Authority
            ],
            programId: this.programId,
            data: discriminator,
        });

        // 3. Send Transaction with Priority
        return await this.sendAndConfirm([ix]);
    }

    // --- UTILS (PURE WEB3.JS - NO ANCHOR DEPENDENCY) ---

    async sendAndConfirm(instructions: TransactionInstruction[]) {
        // --- ADD PRIORITY FEES ---
        const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({ 
            units: 400_000 
        });
        const addPriorityFee = ComputeBudgetProgram.setComputeUnitPrice({ 
            microLamports: 50000 // Even higher priority for stability
        });

        const tx = new Transaction()
            .add(modifyComputeUnits)
            .add(addPriorityFee)
            .add(...instructions);
        
        const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash();
        tx.recentBlockhash = blockhash;
        tx.feePayer = this.wallet.publicKey!;

        try {
            // Use standard Wallet Adapter method
            const signature = await this.wallet.sendTransaction(tx, this.connection);
            
            console.log("Sent! Sig:", signature);
            
            // Confirm manually
            await this.connection.confirmTransaction({
                signature,
                blockhash,
                lastValidBlockHeight
            }, "confirmed");

            console.log("Confirmed!");
            return signature;
        } catch (e: any) {
            console.error("Transaction Failed Full Error:", e);
            if (e.logs) {
                console.error("Transaction Logs:", e.logs);
            }
            throw e;
        }
    }

    async fetchGameState() {
        const gameStatePDA = this.getGameStatePDA();
        try {
            const accountInfo = await this.connection.getAccountInfo(gameStatePDA);
            if (!accountInfo) {
                console.log("No account info found for PDA");
                return null;
            }

            const rawData = accountInfo.data;
            // Create view directly from the buffer with correct offset/length
            const view = new DataView(rawData.buffer, rawData.byteOffset, rawData.byteLength);

            // Offsets based on struct:
            // discriminator (8)
            // is_active (1)
            // round_number (8) -> offset 9
            // timer_end (8) -> offset 17
            // snow_collected (8) -> offset 25
            // pot_balance (8) -> offset 33
            
            const isActive = view.getUint8(8) === 1;
            const timerEndTimestamp = Number(view.getBigInt64(17, true));
            const snowCollected = Number(view.getBigUint64(25, true)) / 1_000_000;
            const potBalanceSol = Number(view.getBigUint64(33, true)) / 1_000_000_000;

            // Dynamic Vector Reading for last_pushers
            let offset = 41;
            const vecLen = view.getUint32(offset, true);
            offset += 4; // Skip length bytes

            const lastPushers: string[] = [];
            for(let i=0; i<vecLen; i++) {
                // Each pubkey is 32 bytes
                const pubkeyBytes = rawData.slice(offset, offset + 32);
                lastPushers.push(new PublicKey(pubkeyBytes).toBase58());
                offset += 32;
            }

            // NOW we are at the correct position for pushCount
            const pushCount = Number(view.getBigUint64(offset, true));

            console.log("Fetched Game State:", { isActive, pushCount, lastPushers });

            return {
                isActive,
                roundNumber: 1, 
                timerEndTimestamp, 
                snowCollected,
                potBalanceSol,
                pushCount,
                lastPushers
            };
        } catch (e) {
            console.error("Critical error decoding game state (Account likely missing):", e);
            return null;
        }
    }
}