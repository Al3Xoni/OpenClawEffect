"use client";

import React from 'react';
import { useGameStore, ActiveCharacter } from '@/core/state/gameStore';
import { getTerrainScreenY } from '@/core/systems/terrainSystem';

const CharacterItem: React.FC<{ character: ActiveCharacter }> = ({ character }) => {
  const worldOffset = useGameStore((state) => state.camera.worldOffset);
  const screenWidth = useGameStore((state) => state.screen.width);
  const screenHeight = useGameStore((state) => state.screen.height);

  // 1. Calculate screen position based on FIXED worldX
  const screenX = character.worldX - worldOffset;
  const charScreenY = getTerrainScreenY(character.worldX, worldOffset, screenWidth, screenHeight);

  // 2. Map variant to asset path
  const assetPath = `/assets/characters/caracter (${character.variant}).svg`;

  // Base dimensions
  const charWidth = 40; 
  const charHeight = 55;

  // Format wallet address (e.g., CCxB...JNxy)
  const shortWallet = character.wallet.length > 10 
    ? `${character.wallet.slice(0, 4)}...${character.wallet.slice(-4)}`
    : character.wallet;

  return (
    <g transform={`translate(${screenX}, ${charScreenY})`}>
      
      {/* GLASSMORPHIC WALLET BADGE */}
      <g transform={`translate(0, ${-charHeight - 20})`}>
        {/* Shadow/Glow - Larger for visibility */}
        <rect
          x="-30"
          y="-10"
          width="60"
          height="18"
          rx="9"
          className="fill-cyan-500/20 blur-[3px]"
        />
        {/* Glass Background - Larger and slightly more opaque */}
        <rect
          x="-28"
          y="-9"
          width="56"
          height="16"
          rx="8"
          className="fill-black/50 stroke-white/30 stroke-[0.5px] backdrop-blur-lg"
        />
        {/* Wallet Text - Larger font and better contrast */}
        <text
          x="0"
          y="2.5"
          textAnchor="middle"
          className="text-[9px] font-black fill-cyan-300 select-none pointer-events-none tracking-tight"
          style={{ fontFamily: 'monospace' }}
        >
          {shortWallet}
        </text>
      </g>

      {/* Character Sprite */}
      <image
        href={assetPath}
        x={-charWidth / 2}
        y={-charHeight + 10}
        width={charWidth}
        height={charHeight}
        style={{ 
          transform: character.flip ? 'scaleX(-1)' : 'none',
        }}
      />
    </g>
  );
};

export const CharactersLayer: React.FC = () => {
  const activeCharacters = useGameStore((state) => state.activeCharacters);

  return (
    <g>
      {activeCharacters.map((char) => (
        <CharacterItem key={char.id} character={char} />
      ))}
    </g>
  );
};