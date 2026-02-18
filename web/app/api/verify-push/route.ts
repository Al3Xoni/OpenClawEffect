import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Connection } from '@solana/web3.js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";
const TREASURY_WALLET = process.env.NEXT_PUBLIC_TREASURY_ADDRESS;
const SNOW_MINT = process.env.NEXT_PUBLIC_SNOW_MINT;
const TIMER_INCREMENT = parseInt(process.env.NEXT_PUBLIC_TIMER_INCREMENT || '180');

export async function POST(req: NextRequest) {
    try {
        const { signature } = await req.json();
        if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

        console.log(`[Verify] Validating TX: ${signature}`);
        const connection = new Connection(RPC_URL, 'confirmed');

        // Wait a bit and fetch transaction
        let tx = null;
        for (let i = 0; i < 6; i++) {
            tx = await connection.getParsedTransaction(signature, {
                maxSupportedTransactionVersion: 0,
                commitment: 'confirmed'
            });
            if (tx) break;
            await new Promise(r => setTimeout(r, 2000));
        }

        if (!tx) return NextResponse.json({ error: "TX not found on chain" }, { status: 404 });

        // Verify if it's a transfer to our Treasury
        const postBalances = tx.meta?.postTokenBalances || [];
        const validTransfer = postBalances.find(b => 
            b.owner === TREASURY_WALLET && 
            b.mint === SNOW_MINT
        );

        if (!validTransfer) {
            return NextResponse.json({ error: "No valid transfer to treasury found in TX" }, { status: 400 });
        }

        // Check if accountKeys is an array of objects (ParsedMessageAccount) or just PublicKeys
        const accountKeys = tx.transaction.message.accountKeys;
        const pusher = accountKeys[0].pubkey.toBase58();
        const amount = 100000; // Fixed cost per push

        // Update Database
        const newTimerEnd = new Date(Date.now() + TIMER_INCREMENT * 1000).toISOString();
        const { data: state } = await supabase.from('game_state').select('*').eq('id', 1).single();
        
        const lastPushers = state?.last_pushers || [];
        const updatedPushers = [pusher, ...lastPushers].slice(0, 10);

        await supabase.from('game_state').update({
            timer_end: newTimerEnd,
            push_count: (state?.push_count || 0) + 1,
            last_pushers: updatedPushers,
            treasury_balance: (state?.treasury_balance || 0) + amount,
            updated_at: new Date().toISOString()
        }).eq('id', 1);

        await supabase.from('pushes').insert({
            signature,
            round_id: state?.current_round_id || 1,
            pusher_wallet: pusher,
            amount,
            token_mint: SNOW_MINT
        });

        console.log(`[Verify] Success for ${pusher}`);
        return NextResponse.json({ status: "confirmed" });

    } catch (err: any) {
        console.error("[Verify Error]:", err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
