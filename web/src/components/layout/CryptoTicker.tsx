"use client";

import React, { useEffect, useState } from 'react';

export const CryptoTicker: React.FC = () => {
  const [prices, setPrices] = useState({ sol: 0, btc: 0, eth: 0 });

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana,bitcoin,ethereum&vs_currencies=usd');
        const data = await res.json();
        setPrices({
          sol: data.solana.usd,
          btc: data.bitcoin.usd,
          eth: data.ethereum.usd
        });
      } catch (e) {
        console.error("Failed to fetch prices", e);
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full bg-black border-y border-white/10 overflow-hidden py-2">
      <div className="animate-[scroll_30s_linear_infinite] whitespace-nowrap flex gap-12 text-sm font-mono text-gray-400">
        
        {/* Repeat content to create seamless loop effect */}
        {[...Array(4)].map((_, i) => (
            <React.Fragment key={i}>
                <span className="flex items-center gap-2">
                    <span className="text-cyan-400 font-bold">SOL</span> ${prices.sol.toFixed(2)}
                </span>
                <span className="text-white/20">|</span>
                <span className="flex items-center gap-2">
                    <span className="text-orange-400 font-bold">BTC</span> ${prices.btc.toLocaleString()}
                </span>
                <span className="text-white/20">|</span>
                <span className="flex items-center gap-2">
                    <span className="text-purple-400 font-bold">ETH</span> ${prices.eth.toLocaleString()}
                </span>
                <span className="text-white/20">|</span>
                 <span className="flex items-center gap-2">
                    <span className="text-green-400 font-bold">CLAWBALL</span> $0.000420 (LIVE)
                </span>
                 <span className="text-white/20">///</span>
            </React.Fragment>
        ))}
        
      </div>
    </div>
  );
};