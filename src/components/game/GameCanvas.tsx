import { useState, useCallback, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import Terrain from './Terrain';
import Player from './Player';
import Fish from './Fish';
import Trees from './Trees';
import { Sky } from '@react-three/drei';

interface GameCanvasProps {
  onCatch: () => void;
  fishingState: 'idle' | 'casting' | 'waiting' | 'caught';
  setFishingState: (state: 'idle' | 'casting' | 'waiting' | 'caught') => void;
  onShowCatchAnim: (fishName: string) => void;
}

// Camera that follows the player from a fixed isometric offset
function FollowCamera({ target }: { target: React.MutableRefObject<THREE.Vector3> }) {
  useFrame(({ camera }) => {
    const offset = new THREE.Vector3(20, 25, 20);
    camera.position.copy(target.current).add(offset);
    camera.lookAt(target.current);
  });
  return null;
}

export default function GameCanvas({ onCatch, fishingState, setFishingState, onShowCatchAnim }: GameCanvasProps) {
  const [playerPos, setPlayerPos] = useState(new THREE.Vector3(5, 0, 5));
  const playerPosRef = useRef(new THREE.Vector3(5, 0, 5));

  const handlePositionChange = useCallback((pos: THREE.Vector3) => {
    playerPosRef.current.copy(pos);
  }, []);

  // Update terrain chunks less frequently
  const lastChunkRef = useRef('');
  useEffect(() => {
    const interval = setInterval(() => {
      const p = playerPosRef.current;
      const chunkKey = `${Math.floor(p.x / 32)},${Math.floor(p.z / 32)}`;
      if (chunkKey !== lastChunkRef.current) {
        lastChunkRef.current = chunkKey;
        setPlayerPos(p.clone());
      }
    }, 200);
    return () => clearInterval(interval);
  }, []);

  return (
    <Canvas
      shadows
      camera={{ position: [25, 25, 25], fov: 45, near: 0.1, far: 500 }}
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
      <FollowCamera target={playerPosRef} />
      <Terrain playerPosition={playerPos} />
      <Fish playerPosition={playerPos} />
      <Trees playerPosition={playerPos} />
      <Player
        onPositionChange={handlePositionChange}
        onFish={onCatch}
        fishingState={fishingState}
        setFishingState={setFishingState}
        onShowCatchAnim={onShowCatchAnim}
      />
    </Canvas>
  );
}
