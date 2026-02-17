"use client";

import React from 'react';

export const HowItWorksBar: React.FC = () => {
  return (
    <div id="how-it-works" className="w-full bg-black border-b border-cyan-900/50 py-2 relative overflow-hidden select-none">
      
      <div className="container mx-auto flex flex-wrap justify-between items-center px-4 gap-4 text-[10px] md:text-xs font-mono text-cyan-500/80">
        
        {/* LEFT: STATUS */}
        <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="tracking-widest">PROTOCOL_ACTIVE</span>
        </div>

        {/* CENTER: PIPELINE */}
        <div className="hidden md:flex items-center gap-6">
            <div className="flex items-center gap-2 group cursor-help">
                <span className="text-cyan-700 font-bold">[01]</span>
                <span className="group-hover:text-cyan-300 transition-colors">INIT_CONNECTION</span>
            </div>
            <div className="text-cyan-900">--&gt;</div>
            <div className="flex items-center gap-2 group cursor-help">
                <span className="text-cyan-700 font-bold">[02]</span>
                <span className="group-hover:text-cyan-300 transition-colors">INJECT_SNOW</span>
            </div>
            <div className="text-cyan-900">--&gt;</div>
            <div className="flex items-center gap-2 group cursor-help">
                <span className="text-cyan-700 font-bold">[03]</span>
                <span className="group-hover:text-cyan-300 transition-colors">CLAIM_YIELD</span>
            </div>
        </div>

        {/* RIGHT: VERSION */}
        <div className="flex items-center gap-2 text-cyan-800">
             <span>v2.5.0-hybrid</span>
        </div>

      </div>
    </div>
  );
};