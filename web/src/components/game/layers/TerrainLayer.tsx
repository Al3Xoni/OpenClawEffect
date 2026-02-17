"use client";

import React from 'react';
import { useGameStore } from '@/core/state/gameStore';
import { SEASON_CONFIG } from '@/config/theme.config';
import { shallow } from 'zustand/shallow';

export const TerrainLayer: React.FC = () => {
  // Use separate selectors for each piece of state.
  const terrainPath = useGameStore((state) => state.terrain.path);
  const slopeAngle = useGameStore((state) => state.terrain.slopeAngle);

  const { colors } = SEASON_CONFIG.themes.snowball;

  return (
    <g>
      <defs>
        {/* Gradient for the INNER SHADOW effect, now rotated */}
        <linearGradient 
          id="innerShadowGradient" 
          x1="0" y1="0" x2="0" y2="1" 
          gradientUnits="objectBoundingBox"
          gradientTransform={`rotate(${slopeAngle})`}
        >
          <stop offset="0%" stopColor="black" stopOpacity="0.4" />
          <stop offset="10%" stopColor="black" stopOpacity="0" />
        </linearGradient>

        {/* Filter for the edge glow */}
        <filter id="edgeGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
          <feFlood floodColor={colors.glow} floodOpacity="1" result="color" />
          <feComposite in="color" in2="blur" operator="in" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* 1. Glow Path (Bottom layer) */}
      <path
        d={terrainPath}
        fill="none"
        stroke={colors.glow}
        strokeWidth="10"
        filter="url(#edgeGlow)"
        style={{ transform: 'translateY(-2px)' }}
      />

      {/* 2. Main Terrain Path (Middle layer) - Solid Color */}
      <path
        d={terrainPath}
        fill={colors.terrain}
        stroke={colors.primary}
        strokeWidth="2"
      />

      {/* 3. Inner Shadow Path (Top layer) - Gradient Overlay */}
      <path
        d={terrainPath}
        fill="url(#innerShadowGradient)"
      />
    </g>
  );
};
