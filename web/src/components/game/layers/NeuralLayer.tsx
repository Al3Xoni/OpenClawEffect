"use client";

import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  glowPhase: number;
}

// Force rebuild for Vercel
export const NeuralLayer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | null>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const particlesRef = useRef<Particle[]>([]);
  const settingsRef = useRef({ numParticles: 250, maxDist: 220, speed: 0.25 });

  const color = '#0077ff'; // Deeper, more vibrant electric blue

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const setResponsiveValues = () => {
      const w = window.innerWidth;
      if (w <= 480) {
        settingsRef.current = { numParticles: 100, maxDist: 170, speed: 0.25 };
      } else if (w <= 1024) {
        settingsRef.current = { numParticles: 180, maxDist: 200, speed: 0.25 };
      } else {
        settingsRef.current = { numParticles: 280, maxDist: 220, speed: 0.25 };
      }
    };

    const initParticles = (width: number, height: number) => {
      const { numParticles, speed } = settingsRef.current;
      const particles: Particle[] = [];
      for (let i = 0; i < numParticles; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          z: Math.random() * width,
          vx: (Math.random() - 0.5) * speed,
          vy: (Math.random() - 0.5) * speed,
          vz: (Math.random() - 0.5) * speed,
          glowPhase: Math.random() * Math.PI * 2
        });
      }
      particlesRef.current = particles;
    };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      setResponsiveValues();
      initParticles(canvas.width, canvas.height);
    };

    const draw = () => {
      const { width, height } = canvas;
      const { maxDist } = settingsRef.current;
      const particles = particlesRef.current;
      const mouse = mouseRef.current;

      ctx.clearRect(0, 0, width, height);

      // Draw lines first (back)
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dz = particles[i].z - particles[j].z;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (dist < maxDist) {
            const alpha = 1 - dist / maxDist;
            ctx.strokeStyle = `rgba(0, 119, 255, ${alpha * 0.6})`; // Deep electric blue lines
            ctx.lineWidth = 1.0;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw particles (front)
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.z += p.vz;
        p.glowPhase += 0.05;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;
        if (p.z < 0 || p.z > width) p.vz *= -1;

        const scale = 0.5 + p.z / width;
        const px = (p.x - mouse.x) * scale + mouse.x;
        const py = (p.y - mouse.y) * scale + mouse.y;

        const glow = (Math.sin(p.glowPhase) + 1) * 0.5;
        const radius = 1.5 + glow * 1.8;

        ctx.beginPath();
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        
        // Add glow effect back
        ctx.shadowBlur = 10 + glow * 10;
        ctx.shadowColor = '#0077ff';
        
        ctx.fillStyle = `rgba(0, 119, 255, ${0.7 + glow * 0.3})`; // Higher opacity deep blue
        ctx.fill();
        ctx.shadowBlur = 0; // Reset for next elements
      }

      requestRef.current = requestAnimationFrame(draw);
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX / 2, y: e.clientY / 2 };
    };

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', handleMouseMove);
    
    resize();
    requestRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none opacity-85"
      style={{ mixBlendMode: 'screen' }}
    />
  );
};
