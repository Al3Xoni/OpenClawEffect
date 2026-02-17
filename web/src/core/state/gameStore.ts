import { create } from 'zustand';
import { generateTerrainPath, getTerrainScreenY } from '../systems/terrainSystem';

// Define the types for our game state
interface PhysicsState {
  rotation: number;
  scale: number;
  shakeIntensity: number;
  visualOffset: number; // For idle sway
}

interface CameraState {
  worldOffset: number;
  velocity: number;
  zoom: number;
}

interface ScreenState {
  width: number;
  height: number;
}

interface TerrainState {
  path: string;
  slopeAngle: number;
}

export interface Ornament {
  id: string;
  variant: number;
  x: number;
  yOffset: number;
  scale: number;
  flip: boolean;
}

export interface ActiveCharacter {
  id: string;
  variant: number; // 1 to 24
  worldX: number; // Fixed world position
  flip: boolean;
  wallet: string;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number; // 1.0 (fresh) down to 0.0 (dead)
  color: string;
}

interface GameData {
  timer: number;
  timerEndTimestamp: number;
  treasuryAmount: number;
  roundId: number;
}

interface GameState {
  physics: PhysicsState;
  camera: CameraState;
  screen: ScreenState;
  terrain: TerrainState;
  ornaments: Ornament[];
  activeCharacters: ActiveCharacter[];
  particles: Particle[]; 
  lastGeneratedX: number;
  pushCount: number;
  lastActionTime: number; // For idle animations
  gameData: GameData;
  recentPushers: string[];
}

interface GameActions {
  handlePush: (walletAddress?: string) => void;
  syncGameState: (serverState: Partial<GameData>, newPushCount: number, serverPushers?: string[]) => void;
  update: (time: number) => void;
  setScreenSize: (width: number, height: number) => void;
  tickTimer: () => void;
}

const FRICTION = 0.95;
const ZOOM_THRESHOLD = 10;
const NUM_VARIANTS = 20;
const NUM_CHARACTER_VARIANTS = 24;

const initialState: GameState = {
  physics: { rotation: 0, scale: 3, shakeIntensity: 0, visualOffset: 0 },
  camera: { worldOffset: 0, velocity: 0, zoom: 1 },
  screen: { width: 0, height: 0 },
  terrain: { path: '', slopeAngle: 0 },
  ornaments: [],
  activeCharacters: [],
  particles: [],
  lastGeneratedX: 0,
  pushCount: 0,
  lastActionTime: Date.now(),
  recentPushers: [],
  gameData: {
    timer: 180.0,
    timerEndTimestamp: Date.now() + 180000,
    treasuryAmount: 1250,
    roundId: 1,
  }
};

export const useGameStore = create<GameState & GameActions>((set, get) => ({
  ...initialState,
  
  tickTimer: () => {
      set((state) => {
          const now = Date.now();
          const end = state.gameData.timerEndTimestamp;
          let timeLeft = (end - now) / 1000;
          if (timeLeft < 0) timeLeft = 0;
          
          return { gameData: { ...state.gameData, timer: timeLeft } };
      });
  },

  syncGameState: (serverData, newPushCount, serverPushers) => {
      const state = get();
      
      // --- REHYDRATE PHYSICS (Calculate proper size based on total pushes) ---
      let calculatedScale = 3; // Initial base scale
      let calculatedZoom = 1;  // Initial base zoom
      
      const targetCount = Math.max(state.pushCount, newPushCount);

      for(let i=0; i < targetCount; i++) {
          if (i < ZOOM_THRESHOLD) {
             calculatedScale *= 1.02;
          } else {
             calculatedScale *= 1.005;
             calculatedZoom *= 0.99;
          }
      }

      const newRecentPushers = serverPushers || state.recentPushers;

      // 1. NEW PUSH DETECTED
      if (newPushCount > state.pushCount) {
          const newCameraVelocity = state.camera.velocity + 10;
          
          // Use the first pusher from server as the visual trigger if available
          const latestPusher = (serverPushers && serverPushers.length > 0) ? serverPushers[0] : "Unknown";
          
          const snowballWorldX = state.camera.worldOffset + (state.screen.width * 0.5);
          
          const newCharacter: ActiveCharacter = {
              id: Math.random().toString(36).substr(2, 9),
              variant: Math.floor(Math.random() * NUM_CHARACTER_VARIANTS) + 1,
              worldX: snowballWorldX - 15,
              flip: Math.random() > 0.5,
              wallet: latestPusher,
          };
          
          const newParticles: Particle[] = [];
          const terrainY = getTerrainScreenY(snowballWorldX, state.camera.worldOffset, state.screen.width, state.screen.height);
          for(let i=0; i<12; i++) {
            newParticles.push({
              id: Math.random().toString(36).substr(2, 9),
              x: snowballWorldX + (Math.random() - 0.5) * 40,
              y: terrainY - 10,
              vx: (Math.random() - 0.5) * 15,
              vy: -Math.random() * 15 - 5,
              life: 1.0,
              color: Math.random() > 0.5 ? '#FFFFFF' : '#A5F3FC'
            });
          }

          set({
              pushCount: newPushCount,
              lastActionTime: Date.now(),
              gameData: { ...state.gameData, ...serverData },
              recentPushers: newRecentPushers,
              activeCharacters: [...state.activeCharacters, newCharacter].slice(-30),
              particles: [...state.particles, ...newParticles],
              camera: { ...state.camera, velocity: newCameraVelocity, zoom: calculatedZoom },
              physics: { ...state.physics, scale: calculatedScale, shakeIntensity: 10 },
          });
      } 
      // 2. LAG/OLD DATA
      else if (newPushCount < state.pushCount) {
          if (newPushCount < 5 && state.pushCount > 10) {
               set({
                  pushCount: newPushCount,
                  gameData: { ...state.gameData, ...serverData },
                  recentPushers: newRecentPushers,
                  camera: { ...state.camera, zoom: calculatedZoom },
                  physics: { ...state.physics, scale: calculatedScale },
              });
          } else {
              set({
                  gameData: { ...state.gameData, ...serverData },
                  recentPushers: newRecentPushers,
              });
          }
      } 
      // 3. SYNC
      else {
          set({
              pushCount: newPushCount,
              gameData: { ...state.gameData, ...serverData },
              recentPushers: newRecentPushers,
              camera: { ...state.camera, zoom: calculatedZoom },
              physics: { ...state.physics, scale: calculatedScale },
          });
      }
  },

  setScreenSize: (width, height) => {
    const startY = height * 0.90;
    const endY = height * 0.40;
    const angle = Math.atan2(endY - startY, width) * (180 / Math.PI);
    
    const initialOrnaments: Ornament[] = [];
    let currentX = 200; 
    while (currentX < width) {
        initialOrnaments.push({
          id: Math.random().toString(36).substr(2, 9),
          variant: Math.floor(Math.random() * NUM_VARIANTS), 
          x: currentX,
          yOffset: Math.random() * 200 + 50,
          scale: 0.6 + Math.random() * 0.6,
          flip: Math.random() > 0.5,
        });
        currentX += Math.random() * 800 + 600; 
    }

    set({
      screen: { width, height },
      terrain: { ...get().terrain, slopeAngle: angle },
      ornaments: initialOrnaments,
      lastGeneratedX: currentX, 
    });
  },

  handlePush: (walletAddress) => {
    set((state) => {
      const newCameraVelocity = state.camera.velocity + 10;
      const newPushCount = state.pushCount + 1;
      const newGameData = {
          ...state.gameData,
          timerEndTimestamp: Date.now() + 180000,
          timer: 180.0,
          // Treasury updates strictly from server sync now to avoid UI jumps
      };

      const snowballWorldX = state.camera.worldOffset + (state.screen.width * 0.5);
      
      // Update Recent Pushers (limit to 10)
      const pusher = walletAddress || `Anon_${Math.random().toString(36).substr(2, 4)}`;
      const newRecentPushers = [pusher, ...state.recentPushers].slice(0, 10);

      // Spawn Character
      const newCharacter: ActiveCharacter = {
          id: Math.random().toString(36).substr(2, 9),
          variant: Math.floor(Math.random() * NUM_CHARACTER_VARIANTS) + 1,
          worldX: snowballWorldX - 15,
          flip: Math.random() > 0.5,
          wallet: pusher,
      };

      // Spawn Particles
      const newParticles: Particle[] = [];
      const numParticles = 12;
      const terrainY = getTerrainScreenY(snowballWorldX, state.camera.worldOffset, state.screen.width, state.screen.height);
      
      for(let i=0; i<numParticles; i++) {
        newParticles.push({
          id: Math.random().toString(36).substr(2, 9),
          x: snowballWorldX + (Math.random() - 0.5) * 40,
          y: terrainY - 10,
          vx: (Math.random() - 0.5) * 15,
          vy: -Math.random() * 15 - 5,
          life: 1.0,
          color: Math.random() > 0.5 ? '#FFFFFF' : '#A5F3FC'
        });
      }

      let newZoom = state.camera.zoom;
      let newScale = state.physics.scale;

      if (newPushCount <= ZOOM_THRESHOLD) {
        newScale = state.physics.scale * 1.02;
      } else {
        newScale = state.physics.scale * 1.005;
        newZoom = state.camera.zoom * 0.99;
      }

      return {
        pushCount: newPushCount,
        lastActionTime: Date.now(),
        gameData: newGameData,
        recentPushers: newRecentPushers,
        activeCharacters: [...state.activeCharacters, newCharacter].slice(-30),
        particles: [...state.particles, ...newParticles],
        camera: { ...state.camera, velocity: newCameraVelocity, zoom: newZoom },
        physics: { ...state.physics, scale: newScale, shakeIntensity: 15 },
      };
    });
  },

  update: (time: number) => {
    set((state) => {
      const { worldOffset, velocity, zoom } = state.camera;
      const { width, height } = state.screen;

      const newCameraVelocity = velocity * FRICTION;
      const newWorldOffset = worldOffset + newCameraVelocity;
      
      // --- Idle Animation Logic ---
      const now = Date.now();
      const idleTime = now - state.lastActionTime;
      let idleRotation = 0;
      let idleXOffset = 0;

      if (idleTime > 5000) {
          const t = (idleTime - 5000) / 1000; // seconds of idleness
          // Gently roll down (right) and back up (left) - INCREASED AMPLITUDE
          idleXOffset = Math.sin(t * 1.2) * 40; 
          idleRotation = Math.sin(t * 1.2) * 25;
      }

      const newRotation = (state.physics.rotation - newCameraVelocity * 0.5) + (idleTime > 5000 ? Math.sin((idleTime - 5000) / 1000 * 1.2) * 1.5 : 0);
      
      const newTerrainPath = generateTerrainPath(width, height, newWorldOffset, zoom);
      
      let newShake = state.physics.shakeIntensity * 0.9;
      if (newShake < 0.5) newShake = 0;

      let updatedParticles = state.particles.map(p => ({
        ...p,
        y: p.y + p.vy,
        vy: p.vy + 0.4, 
        life: p.life - 0.01 
      })).filter(p => p.life > 0);

      let newOrnaments = [...state.ornaments];
      let newLastX = state.lastGeneratedX;
      const visibleRightEdge = newWorldOffset + (width / zoom);
      
      if (visibleRightEdge + 1500 > newLastX) {
        const nextX = newLastX + Math.random() * 800 + 600; 
        newOrnaments.push({
          id: Math.random().toString(36).substr(2, 9),
          variant: Math.floor(Math.random() * NUM_VARIANTS), 
          x: nextX,
          yOffset: Math.random() * 200 + 50, 
          scale: 0.6 + Math.random() * 0.6,
          flip: Math.random() > 0.5,
        });
        newLastX = nextX;
      }

      // --- Cleanup Logic ---
      const visibleLeftEdge = newWorldOffset - (width / zoom);
      
      // Filter based on visibility
      newOrnaments = newOrnaments.filter(o => o.x > visibleLeftEdge - 200);
      const newActiveCharacters = state.activeCharacters.filter(c => c.worldX > visibleLeftEdge - 200);
      updatedParticles = updatedParticles.filter(p => p.x > visibleLeftEdge - 200);

      return {
        camera: { ...state.camera, velocity: newCameraVelocity, worldOffset: newWorldOffset },
        physics: { 
            ...state.physics, 
            rotation: newRotation, 
            shakeIntensity: newShake,
            visualOffset: idleXOffset // Apply the calculated sway
        },
        terrain: { ...state.terrain, path: newTerrainPath },
        ornaments: newOrnaments,
        activeCharacters: newActiveCharacters,
        particles: updatedParticles,
        lastGeneratedX: newLastX,
      }
    });
  },
}));