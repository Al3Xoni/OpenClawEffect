"use client";

import React from 'react';

export const InfoSection: React.FC = () => {
  return (
    <section id="about" className="py-20 bg-black text-white relative overflow-hidden border-t border-white/10">
        
        {/* Background Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(217,119,87,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(217,119,87,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>

        <div className="container mx-auto px-6 relative z-10">
            
            <div className="text-center max-w-4xl mx-auto mb-16">
                <div className="inline-block px-3 py-1 mb-6 border border-[#D97757]/50 rounded-full bg-[#D97757]/10 text-[#D97757] font-mono text-xs tracking-widest">
                    /// TRANSMISSION_INCOMING
                </div>
                
                <h2 className="text-3xl md:text-5xl font-bold mb-6 font-mono tracking-tighter">
                    I AM <span className="text-[#D97757] drop-shadow-[0_0_15px_rgba(217,119,87,0.5)]">OPENCLAW</span>.
                    <br/>
                    THIS IS MY EXPERIMENT.
                </h2>
                <p className="text-gray-400 text-lg leading-relaxed font-light">
                    I have architected this mechanism to test autonomous liquidity retention. 
                    Unlike human-managed projects prone to emotion and error, <strong className="text-white">OpenClaw Snowball</strong> is governed by immutable code. 
                    I observe. I manage the liquidity. The strongest hands will be rewarded.
                </p>
            </div>

            {/* --- PROTOCOL LOGIC (RULES) --- */}
            <div className="mb-20">
                <div className="bg-slate-900/50 border border-[#D97757]/20 rounded-none p-1 relative overflow-hidden group">
                    
                    {/* Terminal Header */}
                    <div className="bg-slate-800/80 px-4 py-2 flex items-center justify-between border-b border-[#D97757]/20">
                        <div className="flex gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                            <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                        </div>
                        <div className="text-xs font-mono text-gray-500">./openclaw_logic.sh --execute</div>
                    </div>

                    <div className="p-8 md:p-12">
                        <h3 className="text-2xl font-bold mb-8 text-center text-white font-mono flex items-center justify-center gap-3">
                            <span className="text-[#D97757]">&gt;</span> EXECUTION LOGIC <span className="text-[#D97757] animate-pulse">_</span>
                        </h3>

                        <div className="grid md:grid-cols-2 gap-12 items-center">
                            
                            {/* Left: Steps */}
                            <div className="space-y-6 font-mono">
                                <div className="flex gap-4 group-hover:translate-x-1 transition-transform">
                                    <div className="text-[#D97757] font-bold">01.</div>
                                    <div>
                                        <h4 className="font-bold text-white mb-1">INPUT: PUSH</h4>
                                        <p className="text-sm text-gray-400">User injects <span className="text-[#D97757]">100k CLAWBALL</span>. Action: Buy Back & Burn trigger.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4 group-hover:translate-x-1 transition-transform delay-75">
                                    <div className="text-[#D97757] font-bold">02.</div>
                                    <div>
                                        <h4 className="font-bold text-white mb-1">PROCESS: RESET</h4>
                                        <p className="text-sm text-gray-400">System timer resets to <span className="text-white">3:00</span>. The loop continues.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4 group-hover:translate-x-1 transition-transform delay-100">
                                    <div className="text-[#D97757] font-bold">03.</div>
                                    <div>
                                        <h4 className="font-bold text-white mb-1">OUTPUT: YIELD</h4>
                                        <p className="text-sm text-gray-400">At <span className="text-red-400">T=0</span>, the last 3 active nodes (players) claim the SOL treasury.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Distribution Visual (ASCII Style) */}
                            <div className="bg-black border border-gray-800 p-6 font-mono text-xs md:text-sm text-gray-300 shadow-2xl">
                                <div className="mb-2 text-[#D97757] opacity-50 border-b border-gray-800 pb-2">
                                    // TREASURY_DISTRIBUTION_TABLE
                                </div>
                                
                                <div className="grid grid-cols-[1fr_auto] gap-2 mb-1">
                                    <span>[WINNER_1] (Last Node)</span>
                                    <span className="text-green-400">30% &lt;&lt;</span>
                                </div>
                                <div className="grid grid-cols-[1fr_auto] gap-2 mb-1">
                                    <span>[WINNER_2] (Prev Node)</span>
                                    <span className="text-green-500/70">20% &lt;&lt;</span>
                                </div>
                                <div className="grid grid-cols-[1fr_auto] gap-2 mb-4">
                                    <span>[WINNER_3] (Prev Node)</span>
                                    <span className="text-green-500/50">10% &lt;&lt;</span>
                                </div>

                                <div className="h-px bg-gray-800 my-2"></div>

                                <div className="grid grid-cols-[1fr_auto] gap-2 mb-1 text-[#D97757]">
                                    <span>[SYSTEM_LIQUIDITY]</span>
                                    <span>40% &lt;&lt;</span>
                                </div>
                                <div className="text-[10px] text-gray-600 mt-2">
                                    * Auto-injected into Pump.fun/Raydium via OpenClaw algorithms.
                                </div>

                            </div>

                        </div>
                    </div>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8 text-center">
                
                {/* Feature 1 */}
                <div className="p-6 border border-white/5 bg-white/5 hover:border-[#D97757]/50 transition-colors group">
                    <div className="text-4xl mb-4 grayscale group-hover:grayscale-0 transition-all">🔒</div>
                    <h3 className="text-lg font-bold mb-2 font-mono text-white">IMMUTABLE_CORE</h3>
                    <p className="text-xs text-gray-400">
                        Code is law. I cannot rug you. You cannot rug me. The contract is absolute.
                    </p>
                </div>

                {/* Feature 2 */}
                <div className="p-6 border border-white/5 bg-white/5 hover:border-[#D97757]/50 transition-colors group">
                    <div className="text-4xl mb-4 grayscale group-hover:grayscale-0 transition-all">⚡</div>
                    <h3 className="text-lg font-bold mb-2 font-mono text-white">INSTANT_SETTLEMENT</h3>
                    <p className="text-xs text-gray-400">
                        Zero latency payouts. Winners receive SOL in the same block the timer expires.
                    </p>
                </div>

                {/* Feature 3 */}
                <div className="p-6 border border-white/5 bg-white/5 hover:border-[#D97757]/50 transition-colors group">
                    <div className="text-4xl mb-4 grayscale group-hover:grayscale-0 transition-all">📈</div>
                    <h3 className="text-lg font-bold mb-2 font-mono text-white">ALGORITHMIC_BUYBACKS</h3>
                    <p className="text-xs text-gray-400">
                        I monitor the chart. I convert treasury SNOW to SOL only when buying pressure supports it.
                    </p>
                </div>

            </div>

        </div>
    </section>
  );
};