import { useState, useCallback, useRef } from 'react';
import GameCanvas from '@/components/game/GameCanvas';
import GameUI from '@/components/game/GameUI';

const Index = () => {
  const [catches, setCatches] = useState(0);
  const [fishingState, setFishingState] = useState<'idle' | 'casting' | 'waiting' | 'caught'>('idle');
  const [catchAnim, setCatchAnim] = useState<{ fishName: string; show: boolean }>({ fishName: '', show: false });
  const catchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCatch = useCallback(() => {
    setCatches(c => c + 1);
  }, []);

  const handleShowCatchAnim = useCallback((fishName: string) => {
    if (catchTimerRef.current) clearTimeout(catchTimerRef.current);
    setCatchAnim({ fishName, show: true });
    catchTimerRef.current = setTimeout(() => {
      setCatchAnim(prev => ({ ...prev, show: false }));
    }, 2000);
  }, []);

  return (
    <div className="w-screen h-screen overflow-hidden bg-background relative" tabIndex={0} autoFocus>
      <GameCanvas
        onCatch={handleCatch}
        fishingState={fishingState}
        setFishingState={setFishingState}
        onShowCatchAnim={handleShowCatchAnim}
      />
      <GameUI catches={catches} fishingState={fishingState} catchAnim={catchAnim} />
    </div>
  );
};

export default Index;
