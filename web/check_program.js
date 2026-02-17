const { Connection, PublicKey } = require('@solana/web3.js');

const PROGRAM_ID = "HFn2E5EV2MyUw42n2ZENx8btzeKBeQ9aDyo9GRQQ9ebs";

async function check() {
    console.log("Checking Program:", PROGRAM_ID);
    const connection = new Connection("https://api.devnet.solana.com", "confirmed");

    try {
        const info = await connection.getAccountInfo(new PublicKey(PROGRAM_ID));
        
        if (info) {
            console.log("✅ Program Found!");
            console.log("- Executable:", info.executable);
            console.log("- Owner:", info.owner.toBase58());
            console.log("- Data Length:", info.data.length, "bytes");
            console.log("- Lamports:", info.lamports / 1e9, "SOL");

            if (!info.executable) {
                console.error("❌ ERROR: Account exists but is NOT executable. Deployment failed or was closed.");
            } else if (info.owner.toBase58() !== "BPFLoaderUpgradeab1e11111111111111111111111") {
                 console.error("❌ ERROR: Wrong Owner. Should be BPF Loader.");
            } else {
                console.log("🎉 Program looks HEALTHY!");
            }

            // --- CHECK GAME STATE ---
            console.log("\nChecking Game State PDA (seed: 'game_v3')...");
            const [pda] = PublicKey.findProgramAddressSync(
                [Buffer.from("game_v3")],
                new PublicKey(PROGRAM_ID)
            );
            console.log("PDA Address:", pda.toBase58());

            const stateInfo = await connection.getAccountInfo(pda);
            if (stateInfo) {
                console.log("✅ Game State Found!");
                console.log("- Data Length:", stateInfo.data.length);
                if (stateInfo.data.length > 0) {
                     const view = new DataView(stateInfo.data.buffer, stateInfo.data.byteOffset, stateInfo.data.byteLength);
                     const isActive = view.getUint8(8);
                     const timerEnd = Number(view.getBigInt64(17, true));
                     const now = Math.floor(Date.now() / 1000);
                     
                     console.log("- IsActive:", isActive === 1);
                     console.log("- Timer End:", timerEnd);
                     console.log("- Current Time:", now);
                     console.log("- Time Remaining:", timerEnd - now, "seconds");

                     if (now > timerEnd) {
                         console.error("❌ GAME OVER: Timer has expired. Pushing is blocked by contract logic.");
                     }
                }
            } else {
                console.log("⚠️ Game State NOT found. It needs initialization.");
            }

        } else {
            console.error("❌ ERROR: Program Account NOT FOUND on Devnet. It might have been wiped or never deployed.");
        }

    } catch (e) {
        console.error("Connection Error:", e);
    }
}

check();