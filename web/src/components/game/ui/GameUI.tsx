"use client";

import React, { useEffect, useState } from 'react';
import { useGameStore } from '@/core/state/gameStore';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { createClient } from '@supabase/supabase-js';
import { GameOverOverlay } from './GameOverOverlay';
import { RecentPushers } from './RecentPushers';

// ENV VARIABLES
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Initialize Supabase Client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export const GameUI: React.FC = () => {
  const { tickTimer, syncGameState } = useGameStore();
  const wallet = useWallet();

  // DIAGNOSTIC LOG
  useEffect(() => {
    console.log("🛠️ GAME CONFIG:", {
        Network: process.env.NEXT_PUBLIC_SOLANA_NETWORK || process.env.NEXT_PUBLIC_NETWORK,
        Mint: process.env.NEXT_PUBLIC_SNOW_MINT,
        Treasury: process.env.NEXT_PUBLIC_TREASURY_ADDRESS,
        RPC: (process.env.NEXT_PUBLIC_SOLANA_RPC_URL || process.env.NEXT_PUBLIC_RPC_URL) ? "Custom (Helius)" : "Default Public"
    });
  }, []);
  
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
          <span className="text-xs font-bold tracking-widest text-[#D97757]">OPENCLAW SNOWBALL</span>
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
            <div className="text-lg font-bold text-[#D97757]">{treasury} ❄</div>
          </div>
          <div className="bg-black/30 p-2 rounded-lg text-center border border-white/5">
            <div className="text-[10px] text-gray-400 uppercase">Pushes</div>
            <div className="text-lg font-bold text-white">{pushCount}</div>
          </div>
        </div>

        <div className="bg-[#D97757]/10 border border-[#D97757]/30 rounded-xl p-4 mb-4 text-center">
          <div className="text-[#D97757] text-[10px] font-bold uppercase mb-1 tracking-widest">How to play?</div>
          <div className="text-white text-sm font-medium leading-tight">
            Any <span className="text-[#D97757] font-bold underline">BUY</span> on Pump.fun triggers an automatic push!
          </div>
        </div>

        {/* Big Buy Button instead of Push */}
        <a 
            href={`https://pump.fun/coin/${process.env.NEXT_PUBLIC_SNOW_MINT || "EDauNNfEp1QvnBamXHnMd8C8H24hXfEURW8T6DDkpump"}`}
            target="_blank" 
            rel="noopener noreferrer"
            className="w-full group relative overflow-hidden rounded-xl p-4 bg-[#D97757] hover:bg-[#ff8e6b] hover:scale-[1.02] active:scale-[0.98] transition-all flex flex-col items-center justify-center gap-1 shadow-[0_0_20px_rgba(217,119,87,0.4)]"
        >
          <div className="relative z-10 flex flex-col items-center justify-center">
            <span className="text-xl font-black italic tracking-wider text-white drop-shadow-md">
                BUY $CLAWBALL ↗
            </span>
            <span className="text-[10px] font-bold text-[#451f14] bg-white/30 px-2 py-0.5 rounded">TRIGGER A PUSH</span>
          </div>
          <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent z-0" />
        </a>


      </div>
    </div>
    </>
  );
};