"use client";

import React, { useState } from 'react';
import { useGameStore } from '@/core/state/gameStore';
import { GameHistory } from './GameHistory';
import { History } from 'lucide-react';

export const RecentPushers: React.FC = () => {
  const recentPushers = useGameStore(state => state.recentPushers);
  const [showHistory, setShowHistory] = useState(false);

  const formatAddress = (addr: string) => {
    if (addr.startsWith('Anon_')) return addr;
    return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
  };

  return (
    <>
      <GameHistory isOpen={showHistory} onClose={() => setShowHistory(false)} />
      
      <div className="absolute top-6 right-6 z-40 flex flex-col gap-2 w-48">
        <div className="flex items-center justify-between px-3 py-1 bg-black/40 backdrop-blur-md border border-white/10 rounded-t-lg">
          <span className="text-[10px] font-bold tracking-widest text-cyan-400 uppercase">Live Feed</span>
          <button 
            onClick={() => setShowHistory(true)}
            className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-white transition-colors"
          >
            <History className="w-3 h-3" />
            <span>History</span>
          </button>
        </div>
        
        <div className="flex flex-col gap-1.5">
          {recentPushers.length === 0 ? (
            <div className="p-3 bg-black/20 backdrop-blur-sm border border-white/5 rounded-lg text-center">
              <span className="text-[10px] text-gray-500 italic">Waiting for push...</span>
            </div>
          ) : (
            recentPushers.map((wallet, index) => (
              <div 
                key={`${wallet}-${index}`}
                className="flex items-center justify-between p-2 bg-black/40 backdrop-blur-md border border-white/10 rounded-lg animate-in slide-in-from-right duration-300"
                style={{ opacity: 1 - index * 0.08 }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                  <span className="text-[11px] font-mono text-gray-300">{formatAddress(wallet)}</span>
                </div>
                <span className="text-[9px] font-bold text-cyan-600">PUSH</span>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};
