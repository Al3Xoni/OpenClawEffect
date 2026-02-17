'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useState, useEffect } from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

const ADMIN_WALLET = "CCxBFjohSTWpLAtTG7KGJTTnafSibsata4N2JhBftJNx";

export default function AdminPage() {
  const { publicKey, connected } = useWallet();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [timerDuration, setTimerDuration] = useState(180); // Default 3 mins

  useEffect(() => {
    if (connected && publicKey && publicKey.toBase58() === ADMIN_WALLET) {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
  }, [connected, publicKey]);

  const handleResetGame = async () => {
    if (!isAdmin || !publicKey) return;

    setLoading(true);
    setStatus('Resetting game...');

    try {
      const response = await fetch('/api/admin/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet: publicKey.toBase58(),
          action: 'reset_game',
          durationSeconds: timerDuration
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus(`✅ Success! New Round Started. Timer set to ${timerDuration}s.`);
      } else {
        setStatus(`❌ Error: ${data.error}`);
      }
    } catch (err: any) {
      setStatus(`❌ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-8 text-cyan-400">⚡ CLAWDEBALL ADMIN ⚡</h1>

      <div className="bg-slate-800 p-8 rounded-xl shadow-2xl border border-slate-700 max-w-md w-full">
        {!connected ? (
            <div className="flex flex-col items-center gap-4">
                <p className="text-gray-400">Please connect the Admin Wallet</p>
                <WalletMultiButton />
            </div>
        ) : !isAdmin ? (
            <div className="text-center text-red-500 font-mono">
                ACCESS DENIED.
                <br />
                Your wallet is not authorized.
            </div>
        ) : (
            <div className="flex flex-col gap-6">
                <div className="bg-slate-900/50 p-4 rounded-lg">
                    <p className="text-green-400 font-mono text-sm mb-2">● ADMIN CONNECTED</p>
                    <p className="text-xs text-gray-500 break-all">{publicKey?.toBase58()}</p>
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-sm text-gray-400">Timer Duration (Seconds)</label>
                    <select 
                        value={timerDuration} 
                        onChange={(e) => setTimerDuration(Number(e.target.value))}
                        className="bg-slate-700 border border-slate-600 rounded p-2 text-white"
                    >
                        <option value={30}>30 Seconds (Blitz)</option>
                        <option value={60}>1 Minute (Test)</option>
                        <option value={180}>3 Minutes (Standard)</option>
                        <option value={300}>5 Minutes (Long)</option>
                    </select>
                </div>

                <button
                    onClick={handleResetGame}
                    disabled={loading}
                    className={`w-full py-4 rounded-lg font-bold text-lg transition-all ${
                        loading 
                        ? 'bg-gray-600 cursor-not-allowed' 
                        : 'bg-red-500 hover:bg-red-600 shadow-[0_0_20px_rgba(239,68,68,0.5)]'
                    }`}
                >
                    {loading ? 'RESETTING...' : '⚠️ HARD RESET GAME'}
                </button>

                {status && (
                    <div className={`p-3 rounded text-sm font-mono ${status.startsWith('✅') ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'}`}>
                        {status}
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
}
