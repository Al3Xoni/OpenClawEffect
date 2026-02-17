"use client";

import React from 'react';
import { useGameStore } from '@/core/state/gameStore';
import { getTerrainScreenY } from '@/core/systems/terrainSystem';

export const SnowballLayer: React.FC = () => {
  const rotation = useGameStore((state) => state.physics.rotation);
  const scale = useGameStore((state) => state.physics.scale);
  const zoom = useGameStore((state) => state.camera.zoom);
  const screenWidth = useGameStore((state) => state.screen.width);
  const screenHeight = useGameStore((state) => state.screen.height);
  const worldOffset = useGameStore((state) => state.camera.worldOffset);
  const visualOffset = useGameStore((state) => state.physics.visualOffset);
  
  const screenX = (screenWidth * 0.5) + visualOffset;
  const worldX = screenX + worldOffset;
  const terrainTopY = getTerrainScreenY(worldX, worldOffset, screenWidth, screenHeight);
  const radius = 20 * scale * (1 / zoom);
  
  // Ajustare fină Y: Din cauza deformării, bila poate părea că intră în pământ. O ridicăm puțin.
  const finalY = terrainTopY - radius + (radius * 0.05);

  if (screenWidth === 0) return null;

  // ID unic pentru filtru
  const filterId = "snowFluff";

  return (
    <g>
      <defs>
        {/* 1. Gradient MAT de Zăpadă (Alb -> Umbră Gri-Albăstruie) */}
        {/* Eliminăm luciul specular (sticlă) în favoarea unei lumini difuze */}
        <radialGradient id="snowMatteBody" cx="35%" cy="35%" r="85%" fx="30%" fy="30%">
          <stop offset="0%" stopColor="#FFFFFF" />          {/* Alb Pur (Lumină) */}
          <stop offset="50%" stopColor="#F1F5F9" />         {/* Slate 100 (Corp) */}
          <stop offset="100%" stopColor="#94A3B8" />        {/* Slate 400 (Umbră adâncă) */}
        </radialGradient>

        {/* 2. Umbra de pe jos (Soft Contact Shadow) */}
        <radialGradient id="softShadow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#334155" stopOpacity="0.5" /> 
            <stop offset="100%" stopColor="#334155" stopOpacity="0" />
        </radialGradient>

        {/* 3. FILTRUL ORGANIC: Deformare + Textură */}
        <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
          {/* Generăm zgomot fractal cu frecvență mică pentru "cucuie" mari */}
          <feTurbulence 
            type="fractalNoise" 
            baseFrequency="0.03" 
            numOctaves="3" 
            result="noise" 
          />
          {/* Deformăm geometria cercului pe baza zgomotului */}
          <feDisplacementMap 
            in="SourceGraphic" 
            in2="noise" 
            scale={radius * 0.2} // Deformare proportională (20% din rază)
            xChannelSelector="R" 
            yChannelSelector="G" 
          />
        </filter>
      </defs>

      {/* RENDER: Umbra pe sol (Nedeformată, stă plată) */}
      <ellipse 
        cx={screenX} 
        cy={terrainTopY} 
        rx={radius * 0.85} 
        ry={radius * 0.2} 
        fill="url(#softShadow)" 
      />

      {/* RENDER: Bulgărele Organic */}
      {/* Aplicăm filtrul pe tot grupul care se rotește */}
      <g 
        transform={`translate(${screenX}, ${finalY})`}
        style={{ filter: `url(#${filterId})` }} 
      >
        <g transform={`rotate(${rotation})`}>
            {/* Corpul principal - va fi "ciufulit" de filtru */}
            <circle r={radius} fill="url(#snowMatteBody)" />

            {/* "Chunk-uri" de zăpadă lipite pe el (pentru a vedea rotația) */}
            {/* Acestea vor fi și ele deformate, integrându-se în masa bulgărelui */}
            <circle cx={radius * 0.5} cy={radius * 0.2} r={radius * 0.3} fill="#E2E8F0" opacity="0.4" />
            <circle cx={-radius * 0.4} cy={-radius * 0.3} r={radius * 0.25} fill="#FFFFFF" opacity="0.5" />
            <circle cx={-radius * 0.3} cy={radius * 0.4} r={radius * 0.2} fill="#CBD5E1" opacity="0.3" />
            
            {/* O mică adâncitură/imperfecțiune */}
            <ellipse cx={radius * 0.2} cy={-radius * 0.6} rx={radius * 0.15} ry={radius * 0.1} fill="#94A3B8" opacity="0.2" />
        </g>
      </g>
    </g>
  );
};