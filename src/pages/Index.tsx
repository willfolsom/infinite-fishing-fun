import { useState, useCallback } from 'react';
import GameCanvas from '@/components/game/GameCanvas';
import GameUI from '@/components/game/GameUI';

const Index = () => {
  const [catches, setCatches] = useState(0);
  const [fishingState, setFishingState] = useState<'idle' | 'casting' | 'waiting' | 'caught'>('idle');

  const handleCatch = useCallback(() => {
    setCatches(c => c + 1);
  }, []);

  return (
    <div className="w-screen h-screen overflow-hidden bg-background relative">
      <GameCanvas
        onCatch={handleCatch}
        fishingState={fishingState}
        setFishingState={setFishingState}
      />
      <GameUI catches={catches} fishingState={fishingState} />
    </div>
  );
};

export default Index;
