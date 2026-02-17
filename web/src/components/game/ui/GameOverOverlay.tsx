"use client";

import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { useGameStore } from '@/core/state/gameStore';
import { useWallet } from '@solana/wallet-adapter-react';
import { GameHistory } from './GameHistory';
import { History } from 'lucide-react';

interface GameOverOverlayProps {
  lastPushers?: string[];
}

const ADMIN_WALLET = "CCxBFjohSTWpLAtTG7KGJTTnafSibsata4N2JhBftJNx";

export const GameOverOverlay: React.FC<GameOverOverlayProps> = ({ lastPushers = [] }) => {
  const treasury = useGameStore(state => state.gameData.treasuryAmount);
  const roundId = useGameStore(state => state.gameData.roundId); // Get Round ID
  const { publicKey } = useWallet();
  const [isAdmin, setIsAdmin] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [showHistory, setShowHistory] = useState(false); // History Modal State

  useEffect(() => {
    if (publicKey && publicKey.toBase58() === ADMIN_WALLET) {
        setIsAdmin(true);
    } else {
        setIsAdmin(false);
    }
  }, [publicKey]);

  const handleAdminReset = async () => {
      if (!publicKey) return;
      setResetting(true);
      try {
        const response = await fetch('/api/admin/reset', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              wallet: publicKey.toBase58(),
              action: 'reset_game',
              durationSeconds: 180 
            }),
        });
        if (response.ok) {
            window.location.reload(); 
        } else {
            alert("Reset failed.");
        }
      } catch (e) {
          console.error(e);
      } finally {
          setResetting(false);
      }
  };

  const winners = lastPushers.slice().reverse().slice(0, 3).map((address, idx) => ({
      address: `${address.slice(0, 4)}...${address.slice(-4)}`,
      fullAddress: address,
      rank: idx + 1,
      share: idx === 0 ? 0.30 : idx === 1 ? 0.20 : 0.10, 
      emoji: idx === 0 ? "👑" : idx === 1 ? "🥈" : "🥉"
  }));

  useEffect(() => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };
    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);
      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
    <GameHistory isOpen={showHistory} onClose={() => setShowHistory(false)} />
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-500">
      
      <div className="relative w-[90%] max-w-md p-8 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-cyan-500/30 shadow-[0_0_50px_rgba(8,145,178,0.4)] text-center overflow-hidden flex flex-col max-h-[90vh] overflow-y-auto custom-scrollbar">
        
        {/* Shine Effect */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-50" />

        <div className="mb-6">
          <div className="inline-block px-3 py-1 mb-2 rounded-full bg-cyan-950/50 border border-cyan-500/30 text-[10px] font-bold tracking-widest text-cyan-400 uppercase">
             ROUND #{roundId} ENDED
          </div>
          <h2 className="text-4xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-cyan-300 drop-shadow-sm tracking-tighter animate-pulse">
            GAME OVER
          </h2>
          <p className="text-gray-400 text-sm font-bold uppercase tracking-widest mt-1">
            The Snowball Has Stopped
          </p>
        </div>

        {/* Total Treasury & Stats */}
        <div className="mb-8 grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/20">
                <div className="text-gray-400 text-[10px] font-bold uppercase mb-1">Total Treasury</div>
                <div className="text-xl font-mono font-bold text-white leading-tight">
                    {treasury.toLocaleString()} <span className="text-cyan-400 text-sm">CLAWBALL</span>
                </div>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/50 border border-white/10">
                <div className="text-gray-400 text-[10px] font-bold uppercase mb-1">Total Pushes</div>
                <div className="text-xl font-mono font-bold text-white leading-tight">
                    {useGameStore.getState().pushCount}
                </div>
            </div>
        </div>

        {/* Winners List */}
        <div className="space-y-3 mb-8">
            <div className="text-left text-xs text-gray-500 font-bold uppercase px-2">Winners Podium (Last 3 Pushers)</div>
            
            {winners.length === 0 ? (
                 <div className="p-4 bg-white/5 rounded-lg text-gray-400 italic text-sm">
                    No pushes this round.
                 </div>
            ) : (
                winners.map((winner) => (
                    <div key={winner.fullAddress} className={`flex items-center justify-between p-3 rounded-lg border ${winner.rank === 1 ? 'bg-yellow-500/10 border-yellow-500/40' : 'bg-white/5 border-white/10'}`}>
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">{winner.emoji}</span>
                            <div className="flex flex-col text-left">
                                <span className="text-white font-bold font-mono text-sm">{winner.address}</span>
                                <span className="text-[10px] text-gray-400 uppercase font-bold">{winner.rank === 1 ? 'Grand Winner' : `${winner.rank}nd Place`}</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-cyan-300 font-bold font-mono">
                                {(treasury * winner.share).toFixed(2)} CLAWBALL
                            </div>
                            <div className="text-[10px] text-gray-500 font-bold">
                                {winner.share * 100}% Share
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>

        {/* History Button */}
        <button 
            onClick={() => setShowHistory(true)}
            className="w-full py-3 mb-3 flex items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-gray-300 font-bold text-xs uppercase tracking-widest transition-all border border-white/5 hover:border-white/20"
        >
            <History className="w-4 h-4" />
            <span>View Round History</span>
        </button>

        {/* Admin Reset Button */}
        {isAdmin && (
            <button 
            onClick={handleAdminReset}
            disabled={resetting}
            className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest transition-all shadow-lg animate-pulse ${
                resetting ? 'bg-gray-600 cursor-not-allowed' : 'bg-red-600 hover:bg-red-500 hover:shadow-red-500/25 text-white'
            }`}
            >
                {resetting ? 'RESETTING...' : '⚠️ ADMIN: START NEW ROUND'}
            </button>
        )}

      </div>
    </div>
    </>
  );
};