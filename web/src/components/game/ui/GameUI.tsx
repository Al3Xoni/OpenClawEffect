"use client";

import React, { useEffect, useState } from 'react';
import { useGameStore } from '@/core/state/gameStore';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction, ComputeBudgetProgram } from '@solana/web3.js';
import { 
    createTransferCheckedInstruction, 
    getAssociatedTokenAddress, 
    createAssociatedTokenAccountIdempotentInstruction,
    getAccount,
    TOKEN_2022_PROGRAM_ID 
} from '@solana/spl-token';
import { createClient } from '@supabase/supabase-js';
import { GameOverOverlay } from './GameOverOverlay';
import { RecentPushers } from './RecentPushers';

// ENV VARIABLES
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SNOW_MINT = new PublicKey(process.env.NEXT_PUBLIC_SNOW_MINT!);
const TREASURY_WALLET = new PublicKey(process.env.NEXT_PUBLIC_TREASURY_ADDRESS!);
const PUSH_COST = 100000;
const DECIMALS = 6;

// Initialize Supabase Client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export const GameUI: React.FC = () => {
  const { handlePush, tickTimer, syncGameState } = useGameStore();
  const { connection } = useConnection();
  const wallet = useWallet();
  const { publicKey, sendTransaction } = wallet;

  // DIAGNOSTIC LOG
  useEffect(() => {
    console.log("🛠️ GAME CONFIG:", {
        Network: process.env.NEXT_PUBLIC_NETWORK,
        Mint: process.env.NEXT_PUBLIC_SNOW_MINT,
        Treasury: process.env.NEXT_PUBLIC_TREASURY_ADDRESS,
        RPC: process.env.NEXT_PUBLIC_SOLANA_RPC_URL ? "Custom (Helius)" : "Default Public"
    });
  }, []);
  const [isPushing, setIsPushing] = useState(false);
  const [serverLastPushers, setServerLastPushers] = useState<string[]>([]);
  const [serverTimerEnd, setServerTimerEnd] = useState<number>(Date.now() + 180000);

  // --- 1. SUPABASE REALTIME SYNC ---
  useEffect(() => {
    // Function to fetch state
    const fetchState = async () => {
        const { data, error } = await supabase
            .from('game_state')
            .select('*')
            .eq('id', 1)
            .single();
        
        if (error) {
            console.error("Supabase Fetch Error:", error.message);
        } else if (data) {
            console.log("Supabase State Loaded:", data);
            updateLocalState(data);
        }
    };

    // Initial Fetch
    fetchState();

    // Poll every 5 seconds as backup
    const pollInterval = setInterval(fetchState, 5000);

    // Subscribe to Changes
    const channel = supabase
        .channel('game_state_changes')
        .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'game_state', filter: 'id=eq.1' },
            (payload) => {
                console.log("Realtime Update Received:", payload.new);
                updateLocalState(payload.new);
            }
        )
        .subscribe((status) => {
             console.log("Supabase Realtime Status:", status);
        });

    return () => {
        clearInterval(pollInterval);
        supabase.removeChannel(channel);
    };
  }, []);

  const updateLocalState = (data: any) => {
      const timerEnd = new Date(data.timer_end).getTime();
      const treasury = data.treasury_balance || 0;
      const pushCount = data.push_count || 0;
      const lastPushers = data.last_pushers || [];
      const roundId = data.current_round_id || 1;

      setServerTimerEnd(timerEnd);
      setServerLastPushers(lastPushers);

      syncGameState({
          timerEndTimestamp: timerEnd,
          treasuryAmount: treasury,
          roundId: roundId
      }, pushCount, lastPushers);
  };

  // --- 2. TIMER TICKER ---
  const timer = useGameStore(state => state.gameData.timer);
  const treasury = useGameStore(state => state.gameData.treasuryAmount);
  const pushCount = useGameStore(state => state.pushCount);

  useEffect(() => {
    const interval = setInterval(() => {
        tickTimer(); 
    }, 100);
    return () => clearInterval(interval);
  }, [tickTimer]);

  const formatTime = (time: number) => {
    const safeTime = Math.max(0, time);
    const seconds = Math.floor(safeTime);
    const ms = Math.floor((safeTime - seconds) * 10);
    return `${seconds < 10 ? '0' : ''}${seconds}.${ms}`;
  };

  // --- 3. PUSH ACTION (SPL TRANSFER) ---
  const playPushSound = () => {
    const audio = new Audio('/assets/sounds/crunch.wav');
    audio.volume = 0.4;
    audio.play().catch(err => console.log("Audio play failed:", err));
  };

  const onPushClick = async () => {
    if (!wallet.connected || !publicKey) {
        alert("Please connect your wallet first!");
        return;
    }
    if (isPushing) return;
    setIsPushing(true);

    try {
        // A. Get Token Accounts (Specifying Token-2022)
        const userATA = await getAssociatedTokenAddress(SNOW_MINT, publicKey, false, TOKEN_2022_PROGRAM_ID);
        const treasuryATA = await getAssociatedTokenAddress(SNOW_MINT, TREASURY_WALLET, true, TOKEN_2022_PROGRAM_ID);

        const transaction = new Transaction();

        // 1. Priority Fees (Mainnet)
        const addPriorityFee = ComputeBudgetProgram.setComputeUnitPrice({ 
            microLamports: 150000 
        });
        transaction.add(addPriorityFee);

        // 2. Check & Create Treasury ATA (Using Token-2022)
        try {
            await getAccount(connection, treasuryATA, 'confirmed', TOKEN_2022_PROGRAM_ID);
        } catch (e) {
            console.log("Creating Treasury ATA (Idempotent - Token2022)...");
            transaction.add(
                createAssociatedTokenAccountIdempotentInstruction(
                    publicKey,
                    treasuryATA,
                    TREASURY_WALLET,
                    SNOW_MINT,
                    TOKEN_2022_PROGRAM_ID
                )
            );
        }
        
        // 3. Create Transfer Instruction (Using Token-2022)
        const transferIx = createTransferCheckedInstruction(
            userATA, // from
            SNOW_MINT, // mint
            treasuryATA, // to
            publicKey, // owner
            PUSH_COST * (10 ** DECIMALS), // amount
            DECIMALS,
            [],
            TOKEN_2022_PROGRAM_ID
        );

        transaction.add(transferIx);

        // D. Send & Confirm
        const signature = await sendTransaction(transaction, connection);
        
        // E. Notify Backend to Verify & Update Supabase
        fetch('/api/verify-push', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ signature })
        }).catch(err => console.error("Verify API call failed:", err));

        // Optimistic UI Update immediately
        handlePush(publicKey.toBase58());
        playPushSound();

        console.log("Push TX Sent:", signature);
        
        // We rely on Webhook -> Supabase -> Realtime to confirm the state
        // But for UX we might want to wait for confirmation locally too?
        // No, Fire and Forget is faster for UI. The Webhook handles the truth.

    } catch (error: any) {
        console.error("Push failed:", error);
        alert("Push failed: " + (error.message || error));
    } finally {
        setIsPushing(false);
    }
  };

  const isExpired = timer <= 0.1;

  if (isExpired && pushCount > 0) {
      return (
        <>
            <RecentPushers />
            <GameOverOverlay lastPushers={serverLastPushers} />
        </>
      );
  }

  return (
    <>
    <RecentPushers />
    <div className="absolute top-6 left-6 z-40 flex flex-col gap-4">
      <div className="p-5 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl text-white w-72">
        <div className="flex justify-center items-center mb-4 border-b border-white/10 pb-3">
          <span className="text-xs font-bold tracking-widest text-cyan-400">SNOWBALL.FUN (BETA)</span>
        </div>
        <div className="text-center mb-6">
          <div className="text-xs text-gray-400 uppercase mb-1">Round Ends In</div>
          <div className={`text-5xl font-mono font-black tracking-tighter ${
            timer < 10 ? 'text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'text-white'
          }`}>
            {formatTime(timer)}s
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 mb-6">
          <div className="bg-black/30 p-2 rounded-lg text-center border border-white/5">
            <div className="text-[10px] text-gray-400 uppercase">Treasury</div>
            <div className="text-lg font-bold text-cyan-300">{treasury} ❄</div>
          </div>
          <div className="bg-black/30 p-2 rounded-lg text-center border border-white/5">
            <div className="text-[10px] text-gray-400 uppercase">Pushes</div>
            <div className="text-lg font-bold text-white">{pushCount}</div>
          </div>
        </div>

        <button
          onClick={onPushClick}
          disabled={isPushing}
          className={`w-full group relative overflow-hidden rounded-xl p-4 transition-all ${
             isPushing ? 'bg-gray-600 cursor-not-allowed' : 'bg-cyan-500 hover:bg-cyan-400 hover:scale-[1.02] active:scale-[0.98]'
          }`}
        >
          <div className="relative z-10 flex flex-col items-center justify-center gap-1">
            <span className="text-xl font-black italic tracking-wider text-white drop-shadow-md">
                {isPushing ? "SENDING..." : "PUSH BALL"}
            </span>
            {/* COST BADGE */}
            <span className="text-[10px] font-bold text-cyan-900 bg-white/30 px-2 py-0.5 rounded">COST: 100k CLAWBALL</span>
        </div>
          {!isPushing && <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent z-0" />}
        </button>

        {/* Buy SNOW Reminder */}
        <div className="mt-4 text-center">
            <a 
                href="https://pump.fun/coin/EDauNNfEp1QvnBamXHnMd8C8H24hXfEURW8T6DDkpump" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group flex items-center justify-center gap-2 w-full py-2 px-4 rounded-lg bg-cyan-900/30 border border-cyan-500/50 hover:bg-cyan-500/20 hover:border-cyan-400 transition-all duration-300 animate-pulse hover:animate-none"
            >
                <span className="text-xs text-cyan-200 group-hover:text-white uppercase font-bold tracking-wider">
                    Need $CLAWBALL? Buy on Pump.fun ↗
                </span>
            </a>
        </div>

      </div>
    </div>
    </>
  );
};