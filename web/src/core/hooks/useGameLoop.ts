"use client";

import { useEffect, useRef } from 'react';

type GameLoopCallback = (time: number) => void;

/**
 * A React hook for running a game loop using requestAnimationFrame.
 * @param callback The function to call on each frame.
 */
export const useGameLoop = (callback: (time: number) => void) => {
  const frameId = useRef<number | null>(null);
  const previousTime = useRef<number | null>(null);

  useEffect(() => {
    const loop = (time: number) => {
      callback(time);
      frameId.current = requestAnimationFrame(loop);
    };

    frameId.current = requestAnimationFrame(loop);

    return () => {
      if (frameId.current) {
        cancelAnimationFrame(frameId.current);
      }
    };
  }, [callback]);
};
