import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with Service Role Key (Admin powers)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Config from env
const TREASURY_WALLET = process.env.NEXT_PUBLIC_TREASURY_ADDRESS;
const SNOW_MINT = process.env.NEXT_PUBLIC_SNOW_MINT;
const TIMER_INCREMENT = parseInt(process.env.NEXT_PUBLIC_TIMER_INCREMENT || '1800');
const WEBHOOK_SECRET = process.env.HELIUS_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
    try {
        // --- SECURITY CHECK ---
        const authHeader = req.headers.get('authorization');
        if (WEBHOOK_SECRET && authHeader !== WEBHOOK_SECRET) {
            console.error("Unauthorized Webhook attempt!");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();

        // Helius sends an array of transactions
        if (!Array.isArray(body)) {
            return NextResponse.json({ error: "Invalid body" }, { status: 400 });
        }

        for (const tx of body) {
            console.log(`[Webhook] Processing TX: ${tx.signature}, Type: ${tx.type}`);

            // 1. Detect SWAP (Buy) or TRANSFER to Treasury
            let isPush = false;
            let pusherWallet = "";
            let amount = 0;

            // CASE A: It's a SWAP (User bought the token on a DEX)
            if (tx.type === "SWAP") {
                const swapData = tx.tokenTransfers.find((t: any) => t.mint === SNOW_MINT);
                if (swapData) {
                    isPush = true;
                    pusherWallet = swapData.toUserAccount; // The person who received the tokens (the buyer)
                    amount = swapData.tokenAmount;
                    console.log(`[Webhook] Swap detected! Buyer: ${pusherWallet}`);
                }
            } 
            
            // CASE B: It's a direct transfer to Treasury (Legacy/Manual)
            if (!isPush && tx.tokenTransfers) {
                const validTransfer = tx.tokenTransfers.find((transfer: any) => {
                    return transfer.mint === SNOW_MINT && transfer.toUserAccount === TREASURY_WALLET;
                });
                if (validTransfer) {
                    isPush = true;
                    pusherWallet = validTransfer.fromUserAccount;
                    amount = validTransfer.tokenAmount;
                    console.log(`[Webhook] Direct Transfer detected! From: ${pusherWallet}`);
                }
            }

            if (!isPush) {
                console.log(`[Webhook] Ignoring TX ${tx.signature}: Not a relevant Swap or Transfer.`);
                continue;
            }

            console.log(`[Webhook] Valid Push confirmed for ${pusherWallet}! Amount: ${amount}`);

            // 3. DATABASE ATOMIC UPDATE
            const newTimerEnd = new Date(Date.now() + TIMER_INCREMENT * 1000).toISOString();
            
            // Get current state to update last_pushers array
            const { data: currentState } = await supabase
                .from('game_state')
                .select('last_pushers, push_count, treasury_balance, current_round_id')
                .eq('id', 1)
                .single();

            const lastPushers = currentState?.last_pushers || [];
            const currentRoundId = currentState?.current_round_id || 1;
            const updatedPushers = [validTransfer.fromUserAccount, ...lastPushers].slice(0, 10);
            const newPushCount = (currentState?.push_count || 0) + 1;
            const newTreasuryBalance = (currentState?.treasury_balance || 0) + validTransfer.tokenAmount;

            const { error: updateError } = await supabase
                .from('game_state')
                .update({
                    timer_end: newTimerEnd,
                    push_count: newPushCount,
                    last_pushers: updatedPushers,
                    treasury_balance: newTreasuryBalance,
                    updated_at: new Date().toISOString()
                })
                .eq('id', 1);

            if (updateError) {
                console.error("[Webhook] DB Update Error:", updateError);
                continue;
            }

            // 4. LOG THE PUSH
            await supabase.from('pushes').insert({
                signature: tx.signature,
                round_id: currentRoundId,
                pusher_wallet: validTransfer.fromUserAccount,
                amount: validTransfer.tokenAmount,
                token_mint: SNOW_MINT,
                block_time: new Date(tx.timestamp * 1000).toISOString()
            });

            console.log(`[Webhook] Game state updated for TX: ${tx.signature}`);
        }

        return NextResponse.json({ status: "ok" });

    } catch (err: any) {
        console.error("[Webhook] Fatal Error:", err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
