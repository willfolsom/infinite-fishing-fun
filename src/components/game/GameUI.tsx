import { useState, useCallback } from 'react';
import { useEffect } from 'react';

interface GameUIProps {
  catches: number;
  fishingState: 'idle' | 'casting' | 'waiting' | 'caught';
  catchAnim: { fishName: string; show: boolean };
}

export default function GameUI({ catches, fishingState, catchAnim }: GameUIProps) {
  return (
    <div className="absolute inset-0 pointer-events-none select-none">
      {/* Top bar */}
      <div className="flex justify-between items-start p-4">
        <div className="bg-game-panel/90 backdrop-blur-sm rounded-2xl px-5 py-3 border-2 border-game-panel-border shadow-lg">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🐟</span>
            <span className="text-game-text font-bold text-xl">{catches}</span>
          </div>
        </div>
      </div>

      {/* Center message */}
      {fishingState === 'casting' && (
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="bg-game-panel/90 backdrop-blur-sm rounded-2xl px-6 py-3 border-2 border-game-panel-border">
            <p className="text-game-text font-bold text-lg">Casting... 🎣</p>
          </div>
        </div>
      )}
      {fishingState === 'waiting' && (
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2">
          <div className="bg-game-panel/90 backdrop-blur-sm rounded-2xl px-6 py-3 border-2 border-game-panel-border">
            <p className="text-game-text font-bold text-lg">Waiting for a bite... 🎣</p>
            <p className="text-game-text-muted text-sm text-center">Press F to reel in</p>
          </div>
        </div>
      )}
      {fishingState === 'caught' && (
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="bg-game-highlight/90 backdrop-blur-sm rounded-2xl px-6 py-3 border-2 border-game-panel-border">
            <p className="text-game-text font-bold text-xl">🐟 A fish is biting! 🐟</p>
            <p className="text-game-text text-sm text-center font-semibold">Press F to catch!</p>
          </div>
        </div>
      )}

      {/* Catch celebration animation */}
      {catchAnim.show && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-catch-celebrate">
            <div className="bg-game-highlight/95 backdrop-blur-md rounded-3xl px-10 py-6 border-4 border-game-panel-border shadow-2xl text-center">
              <p className="text-5xl mb-2">🐟</p>
              <p className="text-game-text font-bold text-2xl">You caught a</p>
              <p className="text-game-text font-bold text-3xl mt-1">{catchAnim.fishName}!</p>
            </div>
          </div>
        </div>
      )}

      {/* Bottom controls hint */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
        <div className="bg-game-panel/80 backdrop-blur-sm rounded-2xl px-5 py-2 border-2 border-game-panel-border">
          <p className="text-game-text-muted text-sm">
            <span className="font-bold text-game-text">WASD</span> Move &nbsp;·&nbsp;
            <span className="font-bold text-game-text">F</span> Fish (face water)
          </p>
        </div>
      </div>
    </div>
  );
}
