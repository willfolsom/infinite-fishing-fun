import { useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import Terrain from './Terrain';
import Player from './Player';
import Fish from './Fish';
import { Sky } from '@react-three/drei';

interface GameCanvasProps {
  onCatch: () => void;
  fishingState: 'idle' | 'casting' | 'waiting' | 'caught';
  setFishingState: (state: 'idle' | 'casting' | 'waiting' | 'caught') => void;
}

export default function GameCanvas({ onCatch, fishingState, setFishingState }: GameCanvasProps) {
  const [playerPos, setPlayerPos] = useState(new THREE.Vector3(5, 0, 5));

  const handlePositionChange = useCallback((pos: THREE.Vector3) => {
    setPlayerPos(pos);
  }, []);

  return (
    <Canvas
      shadows
      camera={{ position: [5, 10, 20], fov: 50, near: 0.1, far: 500 }}
      style={{ width: '100%', height: '100%' }}
    >
      <color attach="background" args={['#87CEEB']} />
      <fog attach="fog" args={['#87CEEB', 80, 160]} />
      <Sky sunPosition={[100, 60, -50]} turbidity={0.3} rayleigh={0.5} />
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[50, 40, -30]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={100}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
      />
      <hemisphereLight args={['#87CEEB', '#5b8c5a', 0.4]} />
      <Terrain playerPosition={playerPos} />
      <Fish playerPosition={playerPos} />
      <Player
        onPositionChange={handlePositionChange}
        onFish={onCatch}
        fishingState={fishingState}
        setFishingState={setFishingState}
      />
    </Canvas>
  );
}
