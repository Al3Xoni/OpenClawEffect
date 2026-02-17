"use client";

import React from 'react';
import { useGameStore, Ornament } from '@/core/state/gameStore';
import { getTerrainScreenY } from '@/core/systems/terrainSystem';

const OrnamentItem: React.FC<{ ornament: Ornament }> = ({ ornament }) => {
  const worldOffset = useGameStore((state) => state.camera.worldOffset);
  const screenWidth = useGameStore((state) => state.screen.width);
  const screenHeight = useGameStore((state) => state.screen.height);

  // 1. Calculate screen position
  // We subtract worldOffset because this layer is INSIDE the scaled group 
  // which is already centered, but the coordinates are in world space.
  const screenX = ornament.x - worldOffset;
  const screenY = getTerrainScreenY(ornament.x, worldOffset, screenWidth, screenHeight);

  // 2. Map variant to asset path
  // The store generates variants 0 to 19.
  // We map them to filenames: 'decoratiuni (1).svg' to 'decoratiuni (20).svg'
  const fileIndex = ornament.variant + 1; 
  const assetPath = `/assets/ornaments/decoratiuni (${fileIndex}).svg`;

  // Base dimensions for our assets - INCREASED SIZE
  const baseWidth = 180; 
  const baseHeight = 180;

  return (
    <g transform={`translate(${screenX}, ${screenY})`}>
      <image
        href={assetPath}
        x={- (baseWidth * ornament.scale) / 2}
        // Place it down the hill based on yOffset. 
        // We subtract half height so the visual center is near the coordinate.
        y={ornament.yOffset - (baseHeight * ornament.scale) / 2} 
        width={baseWidth * ornament.scale}
        height={baseHeight * ornament.scale}
        style={{ 
            transform: ornament.flip ? 'scaleX(-1)' : 'none',
            // filter: 'drop-shadow(0px 5px 5px rgba(0,0,0,0.2))' 
        }}
      />
      
      {/* Fallback Placeholder (Small circle) if image is missing */}
      {/* <circle r="2" fill="white" opacity="0.5" /> */}
    </g>
  );
};

export const OrnamentsLayer: React.FC = () => {
  const ornaments = useGameStore((state) => state.ornaments);
  const zoom = useGameStore((state) => state.camera.zoom);

  // Density Culling: Deterministic filtering based on ID hash to avoid flickering
  const visibleOrnaments = ornaments.filter((ornament) => {
    // Simple hash from the last character of the ID (0-35)
    const hash = parseInt(ornament.id.slice(-1), 36); 

    if (zoom < 0.25) return hash % 4 === 0; // Show ~25% (stable)
    if (zoom < 0.6) return hash % 2 === 0;  // Show ~50% (stable)
    return true; // Show 100%
  });

  return (
    <g>
      {visibleOrnaments.map((ornament) => (
        <OrnamentItem key={ornament.id} ornament={ornament} />
      ))}
    </g>
  );
};
