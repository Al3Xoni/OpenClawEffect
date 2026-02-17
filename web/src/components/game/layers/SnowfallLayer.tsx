"use client";

import React, { useEffect, useRef } from 'react';
import { useGameStore } from '@/core/state/gameStore';

export const SnowfallLayer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const screenWidth = useGameStore((state) => state.screen.width);
  const screenHeight = useGameStore((state) => state.screen.height);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // --- CONFIGURATIE FULGI ---
    const flakeCount = 300;
    const snowflakes = Array.from({ length: flakeCount }, () => ({
      x: Math.random() * screenWidth,
      y: Math.random() * screenHeight,
      radius: Math.random() * 3 + 1.5, // 1.5px la 4.5px
      density: Math.random() * 100,     // Pentru oscilatia individuala
      opacity: Math.random() * 0.5 + 0.3,
      // Fiecare fulg are o "greutate" diferita. Cei mici cad mai incet.
      weight: Math.random() * 0.5 + 0.5, 
    }));

    // --- SISTEM DE VREME (WIND SYSTEM) ---
    // Variabilele care se vor schimba in timp real
    let currentWindX = 0;       // Vantul actual
    let targetWindX = 0;        // Spre ce viteza tinde vantul
    let windChangeTimer = 0;    // Cronometru pentru schimbarea vremii
    let verticalSpeedGlobal = 0.8; // Viteza globala de cadere (mai lenta)

    let animationFrameId: number;
    const PI_2 = Math.PI * 2;
    
    let cameraVelocity = 0;
    const unsub = useGameStore.subscribe((state) => {
        cameraVelocity = state.camera.velocity;
    });

    const draw = () => {
      ctx.clearRect(0, 0, screenWidth, screenHeight);
      ctx.fillStyle = "white"; 

      // 1. UPDATE VREME (LOGICA NATURALA)
      windChangeTimer--;
      
      // Daca a expirat timpul (aprox 5-8 secunde la 60fps), schimbam directia vantului
      if (windChangeTimer <= 0) {
          const rand = Math.random();
          
          if (rand < 0.33) {
             // CALM
             targetWindX = Math.random() * 0.5 - 0.25; // Aproape zero
             verticalSpeedGlobal = 0.6; // Cadere lenta, lenesa
          } else if (rand < 0.66) {
             // VANT SPRE STANGA (Rafala)
             targetWindX = -(Math.random() * 3 + 1); // -1 la -4
             verticalSpeedGlobal = 1.0; // Vantul impinge si putin in jos
          } else {
             // VANT SPRE DREAPTA
             targetWindX = Math.random() * 3 + 1; // 1 la 4
             verticalSpeedGlobal = 1.0;
          }

          // Setam urmatoarea schimbare peste 300-500 frame-uri (5-8 secunde)
          windChangeTimer = 300 + Math.random() * 200;
      }

      // Interpolare lina (Lerp) intre vantul curent si cel tinta
      // Asta face ca vantul sa "porneasca" si sa "se opreasca" treptat, nu brusc
      currentWindX += (targetWindX - currentWindX) * 0.005; 


      // 2. DESENARE SI FIZICA FULGILOR
      for (let i = 0; i < flakeCount; i++) {
        const flake = snowflakes[i];

        // Fizica Individuala
        // Y: Cadere lenta bazata pe greutate + viteza globala
        flake.y += (verticalSpeedGlobal * flake.weight) + 0.2; 
        
        // X: Influenta vantului global + oscilatia proprie (sinus)
        // Fulgii mai usori (weight mic) sunt impinsi mai tare de vant
        const windInfluence = currentWindX * (2 - flake.weight); 
        const sway = Math.sin(flake.density + (Date.now() / 1000)) * 0.5;
        
        flake.x += windInfluence + sway;

        // X: Reactia la miscarea camerei (Parallax/Viteza jucatorului)
        flake.x -= cameraVelocity * (flake.radius * 0.15); 

        // Resetare cand ies din ecran (Reciclare)
        // Daca vantul bate tare stanga, fulgii trebuie sa apara din dreapta
        if (flake.y > screenHeight) {
          flake.y = -10;
          flake.x = Math.random() * screenWidth;
        }
        
        // Wrap around lateral
        if (flake.x > screenWidth) flake.x = 0;
        if (flake.x < 0) flake.x = screenWidth;

        // Randare
        ctx.globalAlpha = flake.opacity;
        ctx.beginPath();
        ctx.arc(flake.x, flake.y, flake.radius, 0, PI_2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
        cancelAnimationFrame(animationFrameId);
        unsub();
    };
  }, [screenWidth, screenHeight]);

  return (
    <canvas
      ref={canvasRef}
      width={screenWidth}
      height={screenHeight}
      className="absolute inset-0 pointer-events-none z-30"
    />
  );
};