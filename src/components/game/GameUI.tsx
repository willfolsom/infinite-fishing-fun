import { useState, useEffect, useMemo } from 'react';

interface GameUIProps {
  catches: number;
  fishingState: 'idle' | 'casting' | 'waiting' | 'caught';
  catchAnim: { fishName: string; show: boolean };
}

const EMOJIS = ['🐟', '🐠', '🐡', '🎣', '✨', '💧', '🌊', '⭐'];

function CatchParticles() {
  const particles = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => ({
      id: i,
      emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
      angle: (i / 12) * 360,
      delay: Math.random() * 0.3,
      distance: 80 + Math.random() * 60,
      size: 20 + Math.random() * 16,
    })),
  []);

  return (
    <>
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute pointer-events-none"
          style={{
            fontSize: p.size,
            left: '50%',
            top: '50%',
            animation: `catch-particle 1.2s ease-out ${p.delay}s both`,
            '--particle-x': `${Math.cos((p.angle * Math.PI) / 180) * p.distance}px`,
            '--particle-y': `${Math.sin((p.angle * Math.PI) / 180) * p.distance}px`,
          } as React.CSSProperties}
        >
          {p.emoji}
        </span>
      ))}
    </>
  );
}

export default function GameUI({ catches, fishingState, catchAnim }: GameUIProps) {
  const [prevCatches, setPrevCatches] = useState(catches);
  const [counterBump, setCounterBump] = useState(false);

  useEffect(() => {
    if (catches > prevCatches) {
      setCounterBump(true);
      setPrevCatches(catches);
      const t = setTimeout(() => setCounterBump(false), 400);
      return () => clearTimeout(t);
    }
  }, [catches, prevCatches]);

  return (
    <div className="absolute inset-0 pointer-events-none select-none">
      {/* Top bar */}
      <div className="flex justify-between items-start p-4">
        <div
          className={`bg-game-panel/90 backdrop-blur-sm rounded-2xl px-5 py-3 border-2 border-game-panel-border shadow-lg transition-transform duration-300 ${
            counterBump ? 'scale-125' : 'scale-100'
          }`}
        >
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
          <div className="absolute inset-0 bg-white/20 animate-[catch-flash_0.6s_ease-out_both]" />
          <CatchParticles />
          <div className="animate-[catch-card_0.5s_cubic-bezier(0.34,1.56,0.64,1)_both] relative z-10">
            <div className="bg-game-highlight/95 backdrop-blur-md rounded-3xl px-12 py-8 border-4 border-game-panel-border shadow-2xl text-center">
              <p className="text-6xl mb-3 animate-[catch-fish-bounce_0.8s_ease-out_0.2s_both]">🐟</p>
              <p className="text-game-text font-bold text-2xl animate-[catch-text_0.4s_ease-out_0.15s_both]">You caught a</p>
              <p className="text-game-text font-extrabold text-4xl mt-2 animate-[catch-text_0.4s_ease-out_0.3s_both]">
                {catchAnim.fishName}!
              </p>
              <div className="mt-3 flex justify-center gap-1">
                {['⭐', '⭐', '⭐'].map((s, i) => (
                  <span
                    key={i}
                    className="text-2xl"
                    style={{ animation: `catch-star 0.4s ease-out ${0.4 + i * 0.1}s both` }}
                  >
                    {s}
                  </span>
                ))}
              </div>
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
