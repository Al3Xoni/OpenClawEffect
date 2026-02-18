"use client";

import React from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import Image from 'next/image';

export const Navbar: React.FC = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-3 bg-black/90 backdrop-blur-md border-b border-[#D97757]/30">
      
      {/* Logo Area */}
      <div className="flex items-center gap-3 group cursor-pointer">
        <div className="relative w-10 h-10 transition-transform group-hover:scale-110">
            <Image 
                src="/assets/branding/OpenClaw.webp" 
                alt="OpenClaw Logo" 
                fill 
                className="object-contain"
            />
        </div>
        <div className="flex flex-col leading-none">
            <span className="text-sm font-mono font-bold text-gray-200 tracking-wider group-hover:text-white">
            POWERED BY
            </span>
            <span className="text-base font-mono font-black text-[#D97757] tracking-widest group-hover:text-[#ff8e6b]">
            OPENCLAW
            </span>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="hidden md:flex gap-8 text-xs font-mono font-bold text-[#D97757]/80">
        <a href="#how-it-works" className="hover:text-[#D97757] hover:glow-red transition-colors">[SYSTEM]</a>
        <a href="#game" className="hover:text-[#D97757] hover:glow-red transition-colors">[INTERFACE]</a>
        <a href="#about" className="hover:text-[#D97757] hover:glow-red transition-colors">[LOGIC]</a>
      </div>

      {/* Wallet & CA Action */}
      <div className="flex items-center gap-4">
        
        {/* CONTRACT ADDRESS (CA) DISPLAY */}
        <div 
          onClick={() => {
            const mint = process.env.NEXT_PUBLIC_SNOW_MINT || "";
            if (mint) {
                window.open(`https://pump.fun/coin/${mint}`, "_blank");
                navigator.clipboard.writeText(mint);
            }
          }}
          className="hidden lg:flex items-center gap-3 px-4 py-2 bg-black border border-[#D97757]/50 cursor-pointer hover:border-[#D97757] hover:bg-[#D97757]/10 transition-all group"
          title="Click to view on Pump.fun & Copy CA"
        >
          <span className="text-[10px] font-black text-[#D97757] tracking-widest">CA:</span>
          <span className="text-xs font-mono text-gray-400 group-hover:text-white transition-colors">
            {(process.env.NEXT_PUBLIC_SNOW_MINT || "CONFIG_MINT").slice(0, 6)}...pump
          </span>
        </div>

        <div className="wallet-adapter-button-trigger">
          <WalletMultiButton style={{ 
            backgroundColor: 'rgba(217, 119, 87, 0.1)', // Red tint
            border: '1px solid rgba(217, 119, 87, 0.5)',
            color: '#D97757', // OpenClaw Red
            fontFamily: 'monospace',
            fontWeight: '700',
            fontSize: '14px',
            height: '40px',
            padding: '0 20px',
            borderRadius: '0px', // Square for tech look
            textTransform: 'uppercase',
            letterSpacing: '1px'
        }} />
      </div>
      </div>

    </nav>
  );
};