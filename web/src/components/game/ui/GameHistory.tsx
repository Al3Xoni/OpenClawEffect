"use client";

import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { X, Trophy, History, ChevronDown, ChevronUp } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface RoundData {
  id: number;
  end_time: string;
  total_pot: number;
  winner_wallet: string; // Primary winner
  push_count?: number;   // Calculated
  winners?: any[];       // Top 3 Calculated
}

interface GameHistoryProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GameHistory: React.FC<GameHistoryProps> = ({ isOpen, onClose }) => {
  const [rounds, setRounds] = useState<RoundData[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedRound, setExpandedRound] = useState<number | null>(null);
  const [roundDetails, setRoundDetails] = useState<Record<number, { push_count: number, winners: any[] }>>({});

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen]);

  const fetchHistory = async () => {
    setLoading(true);
    // 1. Fetch completed rounds
    const { data, error } = await supabase
      .from('rounds')
      .select('*')
      .eq('status', 'completed')
      .order('id', { ascending: false })
      .limit(20); // Last 20 rounds

    if (data) {
      setRounds(data);
    }
    setLoading(false);
  };

  const fetchRoundDetails = async (roundId: number) => {
    // If we already have details, just toggle
    if (roundDetails[roundId]) {
      setExpandedRound(expandedRound === roundId ? null : roundId);
      return;
    }

    // 2. Fetch Pushes for this round to calculate stats
    // We need count and last 3
    const { data: pushes, count } = await supabase
      .from('pushes')
      .select('pusher_wallet, block_time', { count: 'exact' })
      .eq('round_id', roundId)
      .order('block_time', { ascending: true }); // We need sequence. Actually ascending order means last ones are at the end.

    if (pushes) {
      // Last 3 are the winners (in reverse order: Last is #1)
      const last3 = pushes.slice(-3).reverse();
      
      const winners = last3.map((p, idx) => ({
        address: p.pusher_wallet,
        rank: idx + 1,
        time: new Date(p.block_time).toLocaleTimeString()
      }));

      setRoundDetails(prev => ({
        ...prev,
        [roundId]: {
          push_count: count || pushes.length,
          winners: winners
        }
      }));
      
      setExpandedRound(roundId);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/10 rounded-lg">
                <History className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
                <h2 className="text-xl font-bold text-white">Round History</h2>
                <p className="text-xs text-gray-400">Hall of Fame & Statistics</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {loading ? (
             <div className="text-center py-10 text-gray-500 animate-pulse">Loading archive...</div>
          ) : rounds.length === 0 ? (
             <div className="text-center py-10 text-gray-500">No completed rounds yet.</div>
          ) : (
            rounds.map((round) => (
              <div key={round.id} className="bg-white/5 border border-white/5 rounded-xl overflow-hidden transition-all hover:border-cyan-500/30">
                
                {/* Round Summary Row */}
                <button 
                  onClick={() => fetchRoundDetails(round.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-mono font-bold text-gray-400 border border-white/10">
                      #{round.id}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">
                        Prize Pot: <span className="text-cyan-400">{round.total_pot.toFixed(4)} SOL</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        Ended: {new Date(round.end_time).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {round.winner_wallet && (
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-yellow-500/10 rounded-full border border-yellow-500/20">
                            <Trophy className="w-3 h-3 text-yellow-500" />
                            <span className="text-xs font-mono text-yellow-200">
                                {round.winner_wallet.slice(0, 4)}...{round.winner_wallet.slice(-4)}
                            </span>
                        </div>
                    )}
                    {expandedRound === round.id ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
                  </div>
                </button>

                {/* Expanded Details */}
                {expandedRound === round.id && roundDetails[round.id] && (
                  <div className="bg-black/20 p-4 border-t border-white/5 animate-in slide-in-from-top-2">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-slate-900 p-3 rounded-lg text-center">
                            <div className="text-[10px] text-gray-500 uppercase font-bold">Total Pushes</div>
                            <div className="text-xl font-mono font-bold text-white">{roundDetails[round.id].push_count}</div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-400 mt-2 border-t border-gray-700 pt-2">
                            <span>Total Volume:</span>
                            <span className="font-mono text-cyan-400 font-bold">
                                {(roundDetails[round.id].push_count * 100000).toLocaleString()} <span className="text-xs">CLAWBALL</span>
                            </span>
                        </div>
                    </div>

                    <h4 className="text-xs font-bold text-gray-400 uppercase mb-3 ml-1">🏆 Podium Winners</h4>
                    <div className="space-y-2">
                        {roundDetails[round.id].winners.map((winner: any) => (
                            <div key={winner.rank} className={`flex items-center justify-between p-2 rounded ${winner.rank === 1 ? 'bg-yellow-500/10 border border-yellow-500/20' : 'bg-white/5'}`}>
                                <div className="flex items-center gap-3">
                                    <span className="text-lg">{winner.rank === 1 ? "🥇" : winner.rank === 2 ? "🥈" : "🥉"}</span>
                                    <span className="font-mono text-sm text-gray-300">{winner.address}</span>
                                </div>
                                <span className="text-xs text-gray-600 font-mono">{winner.rank === 1 ? '30%' : winner.rank === 2 ? '20%' : '10%'}</span>
                            </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};
