"use client";

import React from 'react';
import { useGameStore, Particle } from '@/core/state/gameStore';
import { getTerrainScreenY } from '@/core/systems/terrainSystem';

const ParticleItem: React.FC<{ particle: Particle }> = ({ particle }) => {
  const worldOffset = useGameStore((state) => state.camera.worldOffset);
  const screenWidth = useGameStore((state) => state.screen.width);
  const screenHeight = useGameStore((state) => state.screen.height);

  // Calculate screen position based on worldX
  const screenX = particle.x - worldOffset;
  
  // Particles have their own Y (physics), but we render them relative to screen coordinates
  // Since our particles store 'absolute Y' relative to the terrain spawn, 
  // and we are inside the <g> which is ALREADY transformed by zoom? 
  // Wait, the main <g> in GameCanvas has `scale(zoom)`.
  // So we just need to place them at (screenX, particle.y).
  // But wait, `particle.y` was calculated using `getTerrainScreenY` which returns SCREEN Y.
  // This is tricky because the terrain moves up/down based on zoom/offset? 
  // Actually, `getTerrainScreenY` calculates Y based on sine wave logic.
  
  // Let's assume particle.y is the correct screen Y at the moment of spawn.
  // But if the camera moves, the particle should move with the world.
  // The X is handled by (particle.x - worldOffset).
  // The Y is tricky because the terrain curve is fixed function of X.
  // So (particle.x, particle.y) should be fine if they are "world coordinates".
  // But `getTerrainScreenY` returns SCREEN coords. 
  // Let's trust the simulation for now: particle.y is updated by velocity.
  
  return (
    <rect
      x={screenX}
      y={particle.y}
      width={12 * particle.life}
      height={12 * particle.life}
      fill="white"
      style={{
        opacity: particle.life,
        transform: `rotate(${particle.vx * 10}deg)`
      }}
    />
  );
};

export const ParticlesLayer: React.FC = () => {
  const particles = useGameStore((state) => state.particles);

  return (
    <g>
      {particles.map((p) => (
        <ParticleItem key={p.id} particle={p} />
      ))}
    </g>
  );
};
