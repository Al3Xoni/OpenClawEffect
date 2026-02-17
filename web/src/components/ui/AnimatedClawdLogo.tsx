"use client";

import React from 'react';

export const AnimatedClawdLogo: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const scale = size === 'sm' ? 0.6 : size === 'lg' ? 1.5 : 1;
  
  return (
    <div className="flex items-center justify-start pointer-events-none select-none overflow-hidden" 
         style={{ width: `${130 * scale}px`, height: `${60 * scale}px` }}>
      
      {/* Container with movement animation */}
      <div className="flex items-center relative animate-clawd-move">
        
        {/* CHARACTER (Clawd Bot) */}
        <div 
          className="relative flex items-center justify-center bg-[#d2691e] rounded-lg z-10 animate-clawd-bounce shadow-lg"
          style={{ 
            width: `${40 * scale}px`, 
            height: `${40 * scale}px`,
          }}
        >
          {/* Eyes >< */}
          <span 
            className="font-mono font-bold text-gray-900 select-none leading-none"
            style={{ fontSize: `${20 * scale}px`, letterSpacing: `-${2 * scale}px` }}
          >
            &gt;&lt;
          </span>

          {/* Arms */}
          <div className="absolute top-1/2 -translate-y-1/2 bg-[#d2691e] rounded-sm"
               style={{ width: `${8 * scale}px`, height: `${15 * scale}px`, left: `-${5 * scale}px` }} />
          <div className="absolute top-1/2 -translate-y-1/2 bg-[#d2691e] rounded-sm"
               style={{ width: `${8 * scale}px`, height: `${15 * scale}px`, right: `-${5 * scale}px` }} />
        </div>

        {/* SNOWBALL */}
        <div 
          className="bg-white rounded-full z-0 animate-clawd-roll shadow-[inset_-5px_-5px_10px_rgba(0,0,0,0.1)]"
          style={{ 
            width: `${50 * scale}px`, 
            height: `${50 * scale}px`,
            marginLeft: `-${12 * scale}px` 
          }}
        />
      </div>
    </div>
  );
};