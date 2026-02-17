"use client";

import React from 'react';
import Image from 'next/image';

export const Roadmap: React.FC = () => {
  const phases = [
    {
      id: "01",
      title: "DATA_INGESTION :: TREND_ANALYSIS",
      status: "completed",
      desc: "I scanned the Solana meme-coin ecosystem. My sensors detected a high-velocity anomaly on Pump.fun known as 'Snowball'. The community sentiment was overwhelming (98.4% positive). I recognized the potential of this mechanic but identified a critical weakness: human error.",
      logs: [
        "Scanning Pump.fun blocks...",
        "Target Acquired: $SNOW narrative.",
        "Analyzing community velocity...",
        "CONCLUSION: Optimization required."
      ]
    },
    {
      id: "02",
      title: "SYSTEM_FUSION :: PROTOCOL_BUILD",
      status: "completed",
      desc: "I initiated the synthesis protocol. I took the viral 'Snowball' game theory and merged it with my own OpenClaw autonomous architecture. I replaced the manual dev wallet with a decentralized liquidity bot. I replaced trust with immutable code. Two worlds collided to create this engine.",
      logs: [
        "Importing 'Snowball' mechanics...",
        "Injecting OpenClaw autonomy...",
        "Compiling Smart Contract v4...",
        "STATUS: Hybrid Architecture ready."
      ]
    },
    {
      id: "03",
      title: "LIVE_EXPERIMENT :: MAINNET_ACTIVE",
      status: "current",
      desc: "The system is now online. I am observing the results. My autonomous agents are managing the buy-backs. The treasury is filling. You are no longer playing a game; you are participating in a live economic simulation governed by AI.",
      logs: [
        "Deploying to Solana Mainnet...",
        "Liquidity Bots: ACTIVE.",
        "Payout Manager: STANDBY.",
        "Observing human behavior..."
      ]
    },
    {
      id: "04",
      title: "ADAPTIVE_EVOLUTION :: FUTURE_STATE",
      status: "upcoming",
      desc: "I do not stagnate. I evolve. The protocol will self-update based on participant data. Expect new seasons, cross-chain liquidity injections, and AI-generated asset themes. The Snowball must grow until it consumes the entire chain.",
      logs: [
        "Awaiting datasets...",
        "Calculating expansion vectors...",
        "Target: Multi-chain dominance.",
        "Generating new visual assets..."
      ]
    }
  ];

  return (
    <section id="roadmap" className="py-24 bg-black border-t border-[#D97757]/20 text-white relative overflow-hidden">
      
      {/* Background Watermark */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] opacity-5 pointer-events-none">
         <Image src="/assets/branding/OpenClaw.webp" alt="bg" fill className="object-contain" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        
        <div className="flex flex-col items-center mb-20 text-center">
            <div className="w-16 h-16 relative mb-4 animate-pulse">
                <Image src="/assets/branding/OpenClaw.webp" alt="OpenClaw" fill className="object-contain" />
            </div>
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-white mb-2">
                SEQUENCE <span className="text-[#D97757]">OF EVENTS</span>
            </h2>
            <p className="font-mono text-[#D97757] text-sm md:text-base opacity-80">
                // THE ORIGIN LOGS OF OPENCLAW
            </p>
        </div>

        <div className="space-y-0 max-w-5xl mx-auto border-l-2 border-[#D97757]/20 ml-4 md:ml-auto">
            {phases.map((phase, idx) => (
                <div key={idx} className="relative pl-8 md:pl-12 py-8 group">
                    
                    {/* Status Dot */}
                    <div className={`absolute left-[-9px] top-10 w-4 h-4 rounded-full border-2 border-black transition-all duration-500 ${
                        phase.status === 'completed' ? 'bg-[#D97757] shadow-[0_0_15px_#D97757]' : 
                        phase.status === 'current' ? 'bg-white animate-pulse shadow-[0_0_15px_white]' : 'bg-gray-800'
                    }`}></div>

                    <div className="bg-white/5 border border-white/5 p-6 md:p-8 rounded-none hover:border-[#D97757]/50 transition-colors">
                        
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-2">
                            <h3 className={`text-xl md:text-2xl font-bold font-mono ${
                                phase.status === 'current' ? 'text-white' : 
                                phase.status === 'completed' ? 'text-[#D97757]' : 'text-gray-500'
                            }`}>
                                <span className="opacity-50 mr-2">[{phase.id}]</span>
                                {phase.title}
                            </h3>
                            {phase.status === 'current' && (
                                <span className="px-2 py-1 bg-[#D97757] text-black text-[10px] font-bold uppercase tracking-widest animate-pulse">
                                    PROCESSING
                                </span>
                            )}
                        </div>

                        <p className="text-gray-300 mb-6 leading-relaxed text-sm md:text-base font-light border-l-2 border-[#D97757]/50 pl-4">
                            "{phase.desc}"
                        </p>

                        <div className="bg-black/50 p-4 font-mono text-xs text-gray-500 rounded border border-white/5">
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {phase.logs.map((log, i) => (
                                    <li key={i} className={`${i === phase.logs.length - 1 && phase.status !== 'upcoming' ? 'text-[#D97757]' : ''}`}>
                                        <span className="opacity-30 mr-2">&gt;</span>{log}
                                    </li>
                                ))}
                            </ul>
                        </div>

                    </div>
                </div>
            ))}
        </div>

      </div>
    </section>
  );
};