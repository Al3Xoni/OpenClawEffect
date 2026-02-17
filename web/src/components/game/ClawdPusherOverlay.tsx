"use client";

import React from 'react';

export const ClawdPusherOverlay: React.FC = () => {
  return (
    <div className="absolute left-1/2 top-[28%] -translate-x-1/2 z-50 flex items-end pointer-events-none select-none">
        
        {/* CHARACTER (Clawd Bot) */}
        <div 
            className="relative bg-[#d2691e] w-[70px] h-[90px] md:w-[100px] md:h-[120px] -mr-[15px] md:-mr-[25px] z-20 animate-push-strain"
            style={{
                clipPath: 'polygon(10% 0%, 90% 0%, 100% 20%, 100% 60%, 80% 60%, 80% 100%, 60% 100%, 60% 60%, 40% 60%, 40% 100%, 20% 100%, 20% 60%, 0% 60%, 0% 20%)'
            }}
        >
            {/* Eyes >< */}
            <span className="absolute top-[30%] left-1/2 -translate-x-1/2 font-mono font-bold text-[#333] text-[18px] md:text-[24px]">
                &gt;&lt;
            </span>
        </div>

        {/* BIG SNOWBALL */}
        <div 
            className="relative w-[90px] h-[90px] md:w-[130px] md:h-[130px] rounded-full z-10 animate-slow-roll"
            style={{
                background: 'radial-gradient(circle at 30% 30%, #ffffff, #d4f1ff 60%, #a0cfee 100%)',
                boxShadow: 'inset -10px -10px 20px rgba(0,0,0,0.2)'
            }}
        />
    </div>
  );
};