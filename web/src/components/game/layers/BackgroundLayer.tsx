"use client";

import React from 'react';
import { useGameStore } from '@/core/state/gameStore';

// Simple functional component, no memo overhead
const Mountain = ({ height, width, color, snowColor }: any) => (
  <g>
    <path 
      d={`M0,0 L${width/2},-${height} L${width},0 Z`} 
      fill={color} 
      shapeRendering="optimizeSpeed"
    />
    <path 
      d={`M${width * 0.35},-${height * 0.3} L${width/2},-${height} L${width * 0.65},-${height * 0.3} 
          L${width * 0.58},-${height * 0.2} L${width * 0.5},-${height * 0.4} L${width * 0.42},-${height * 0.2} Z`} 
      fill={snowColor}
      shapeRendering="optimizeSpeed"
    />
  </g>
);

export const BackgroundLayer: React.FC = () => {
  const screenWidth = useGameStore((state) => state.screen.width);
  const screenHeight = useGameStore((state) => state.screen.height);
  const worldOffset = useGameStore((state) => state.camera.worldOffset);
  
  const PARALLAX_FAR = 0.1;
  const PARALLAX_NEAR = 0.2;
  const CHUNK_SIZE = 2000;

  if (screenWidth === 0) return null;

  const farOffset = Math.floor(-(worldOffset * PARALLAX_FAR) % CHUNK_SIZE);
  const nearOffset = Math.floor(-(worldOffset * PARALLAX_NEAR) % CHUNK_SIZE);

  // Render static groups directly
  const FarMountainsGroup = (
    <>
      <g transform="translate(100, 0)"><Mountain height={750} width={800} color="#0b364f" snowColor="#c1cfd7" /></g>
      <g transform="translate(800, 0)"><Mountain height={850} width={900} color="#0b364f" snowColor="#c1cfd7" /></g>
      <g transform="translate(1500, 0)"><Mountain height={600} width={700} color="#0b364f" snowColor="#c1cfd7" /></g>
    </>
  );

  const NearMountainsGroup = (
    <>
      <g transform="translate(-100, 0)"><Mountain height={500} width={500} color="#094669" snowColor="#e4e8eb" /></g>
      <g transform="translate(450, 0)"><Mountain height={450} width={600} color="#094669" snowColor="#e4e8eb" /></g>
      <g transform="translate(1000, 0)"><Mountain height={400} width={800} color="#094669" snowColor="#e4e8eb" /></g>
      <g transform="translate(1600, 0)"><Mountain height={480} width={500} color="#094669" snowColor="#e4e8eb" /></g>
    </>
  );

  return (
    <svg 
        className="absolute inset-0 w-full h-full pointer-events-none" 
        style={{ 
            zIndex: 0, 
            background: 'radial-gradient(circle at top, #0b1220, #05070d)',
            willChange: 'transform' 
        }} 
    >
      <pattern id="stars" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
        <circle cx="10" cy="10" r="1" fill="white" opacity="0.5" />
        <circle cx="50" cy="80" r="1.5" fill="white" opacity="0.3" />
        <circle cx="120" cy="40" r="1" fill="white" opacity="0.6" />
        <circle cx="180" cy="150" r="1.2" fill="white" opacity="0.4" />
      </pattern>
      <rect width="100%" height="100%" fill="url(#stars)" />

      {/* Layer 1: Far */}
      <g transform={`translate(${farOffset - CHUNK_SIZE}, ${screenHeight})`}>{FarMountainsGroup}</g>
      <g transform={`translate(${farOffset}, ${screenHeight})`}>{FarMountainsGroup}</g>
      <g transform={`translate(${farOffset + CHUNK_SIZE}, ${screenHeight})`}>{FarMountainsGroup}</g>

      {/* Layer 2: Near */}
      <g transform={`translate(${nearOffset - CHUNK_SIZE}, ${screenHeight})`}>{NearMountainsGroup}</g>
      <g transform={`translate(${nearOffset}, ${screenHeight})`}>{NearMountainsGroup}</g>
      <g transform={`translate(${nearOffset + CHUNK_SIZE}, ${screenHeight})`}>{NearMountainsGroup}</g>
      
      <rect y={screenHeight - 50} width="100%" height="50" fill="linear-gradient(to bottom, transparent, #05070d)" />
    </svg>
  );
};