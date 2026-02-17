"use client";

import React, { useEffect, useRef } from 'react';
import { useGameStore } from '@/core/state/gameStore';
import { useGameLoop } from '@/core/hooks/useGameLoop';

import { BackgroundLayer } from './layers/BackgroundLayer';
import { NeuralLayer } from './layers/NeuralLayer';
import { TerrainLayer } from './layers/TerrainLayer';
import { OrnamentsLayer } from './layers/OrnamentsLayer';
import { CharactersLayer } from './layers/CharactersLayer';
import { SnowballLayer } from './layers/SnowballLayer';
import { ParticlesLayer } from './layers/ParticlesLayer';
import { SnowfallLayer } from './layers/SnowfallLayer';
import { GameUI } from './ui/GameUI';
import { LobbyChat } from './ui/LobbyChat';

const GameCanvas: React.FC = () => {
  const { setScreenSize, update } = useGameStore();
  const zoom = useGameStore((state) => state.camera.zoom);
  const screenWidth = useGameStore((state) => state.screen.width);
  const screenHeight = useGameStore((state) => state.screen.height);
  const shakeIntensity = useGameStore((state) => state.physics.shakeIntensity);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate shake offset
  const shakeX = (Math.random() - 0.5) * shakeIntensity;
  const shakeY = (Math.random() - 0.5) * shakeIntensity;

  // Set screen size on mount and on resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setScreenSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [setScreenSize]);

  // The game loop will update the state
  useGameLoop((time) => {
    update(time);
  });

  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-full overflow-hidden bg-gray-900"
    >
      {/* Background Static Gradient */}
      <svg width="100%" height="100%" className="absolute inset-0 z-0">
        <BackgroundLayer />
      </svg>

      {/* Neural Network Background Effect (Canvas) */}
      <NeuralLayer />

      <svg width="100%" height="100%" className="absolute inset-0 z-10">
        <g 
          transform={`translate(${shakeX}, ${shakeY}) scale(${zoom})`} 
          style={{ 
            transformOrigin: `${screenWidth / 2}px ${screenHeight * 0.65}px`, 
            transition: 'transform 0.1s linear' 
          }}
        >
          <TerrainLayer />
          <OrnamentsLayer />
          <CharactersLayer />
          <SnowballLayer />
          <ParticlesLayer />
        </g>
      </svg>

      {/* Snowfall Layer - Topmost effect */}
      <SnowfallLayer />

      {/* Game UI Overlay (Dashboard) */}
      <GameUI />

      {/* Lobby Chat (P2P) */}
      <LobbyChat />
      
    </div>
  );
};

export default GameCanvas;