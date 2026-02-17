"use client";

import React from 'react';
import Image from 'next/image';

export const ClawdHeader: React.FC = () => {
  return (
    <div className="relative z-10 flex flex-col items-center justify-center w-full pointer-events-none select-none pt-8">
        
        {/* TOP BADGE: SYSTEM STATUS */}
        <div className="flex items-center gap-2 mb-4 px-3 py-1 bg-black/50 border border-[#D97757]/30 rounded-sm backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D97757] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D97757]"></span>
            </span>
            <span className="font-mono text-[10px] text-[#D97757] tracking-[0.2em] uppercase">System Online</span>
        </div>

        {/* MAIN TITLE WITH LOGO */}
        <div className="relative flex flex-col md:flex-row items-center gap-4 md:gap-8">
            
            {/* Logo Image */}
            <div className="relative w-20 h-20 md:w-32 md:h-32 opacity-90 animate-pulse">
                 <Image 
                    src="/assets/branding/OpenClaw.webp" 
                    alt="OpenClaw" 
                    fill 
                    className="object-contain drop-shadow-[0_0_15px_rgba(217,119,87,0.5)]"
                />
            </div>

            {/* Title Text */}
            <div className="text-center md:text-left">
                <h1 
                    className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-none"
                    style={{ fontFamily: 'var(--font-mono), monospace' }}
                >
                    <span className="block text-[#D97757] drop-shadow-[0_0_10px_rgba(217,119,87,0.8)]">OPENCLAW</span>
                    <span className="block text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400">SNOWBALL</span>
                </h1>
            </div>
            
            {/* Scanline Overlay on Text */}
            <div className="absolute inset-0 bg-[url('/scanlines.png')] opacity-20 pointer-events-none mix-blend-overlay"></div>
        </div>

        {/* SUBTITLE: TYPEWRITER STYLE */}
        <div className="mt-6 flex items-center gap-3">
            <div className="h-[1px] w-8 md:w-20 bg-[#D97757]/50"></div>
            <h2 
                className="text-sm md:text-lg text-[#D97757] font-mono tracking-widest uppercase"
                style={{ textShadow: '0 0 10px rgba(217, 119, 87, 0.4)' }}
            >
                AUTONOMOUS LIQUIDITY PROTOCOL
            </h2>
            <div className="h-[1px] w-8 md:w-20 bg-[#D97757]/50"></div>
        </div>

        {/* DECORATIVE DATA STREAM */}
        <div className="mt-2 text-[8px] text-[#D97757] font-mono opacity-50 overflow-hidden whitespace-nowrap w-48 text-center">
            0x4F 0x70 0x65 0x6E 0x43 0x6C 0x61 0x77 0x20 0x41 0x49
        </div>

    </div>
  );
};