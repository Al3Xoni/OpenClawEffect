"use client";

import React, { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import Link from 'next/link';

const ADMIN_WALLET = "CCxBFjohSTWpLAtTG7KGJTTnafSibsata4N2JhBftJNx";

export const Footer: React.FC = () => {
    const { publicKey } = useWallet();
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        if (publicKey && publicKey.toBase58() === ADMIN_WALLET) {
            setIsAdmin(true);
        } else {
            setIsAdmin(false);
        }
    }, [publicKey]);

  return (
    <footer className="bg-black py-12 border-t border-cyan-900/30 text-center text-gray-500 text-sm font-mono">
        <div className="container mx-auto px-6 flex flex-col items-center gap-8">
            
            {/* OpenClaw Credit */}
            <div className="flex flex-col items-center gap-3 group cursor-pointer transition-all duration-300">
                <div className="flex items-center gap-2 px-4 py-2 bg-cyan-950/20 border border-cyan-500/30 rounded-none hover:bg-cyan-900/30 hover:border-cyan-400 transition-all">
                    {/* Chip Icon */}
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-400">
                        <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
                        <rect x="9" y="9" width="6" height="6"></rect>
                        <line x1="9" y1="1" x2="9" y2="4"></line>
                        <line x1="15" y1="1" x2="15" y2="4"></line>
                        <line x1="9" y1="20" x2="9" y2="23"></line>
                        <line x1="15" y1="20" x2="15" y2="23"></line>
                        <line x1="20" y1="9" x2="23" y2="9"></line>
                        <line x1="20" y1="14" x2="23" y2="14"></line>
                        <line x1="1" y1="9" x2="4" y2="9"></line>
                        <line x1="1" y1="14" x2="4" y2="14"></line>
                    </svg>
                    <span className="text-cyan-100/80 font-medium tracking-tight">
                        POWERED BY <span className="text-cyan-400 font-bold">OPENCLAW</span>
                    </span>
                </div>
                <p className="text-cyan-800 text-[10px] uppercase tracking-[0.2em]">The AI that actually builds things</p>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center w-full gap-4 pt-8 border-t border-cyan-900/20">
                <div>
                    &copy; {new Date().getFullYear()} PROTOCOL: OPENCLAWBALL.
                </div>

                <div className="flex gap-6 items-center">
                    <a href="https://x.com/openclawball" target="_blank" className="hover:text-cyan-400 transition-colors">[X_TWITTER]</a>
                    
                    {isAdmin && (
                        <Link 
                            href="/admin" 
                            className="text-red-500 hover:text-red-400 font-bold border border-red-900/50 bg-red-900/20 px-3 py-1 rounded-none hover:bg-red-900/40 transition-all uppercase"
                        >
                            Admin_Console
                        </Link>
                    )}
                </div>
            </div>

        </div>
    </footer>
  );
};