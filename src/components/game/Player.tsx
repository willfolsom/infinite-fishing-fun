import { useRef, useEffect, useCallback, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getTerrainHeight, isWater } from '@/lib/noise';

// Find a safe spawn point on land
function findSafeSpawn(): THREE.Vector3 {
  for (let r = 0; r < 200; r += 2) {
    for (let angle = 0; angle < Math.PI * 2; angle += 0.5) {
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      if (!isWater(x, z)) {
        const h = getTerrainHeight(x, z);
        return new THREE.Vector3(x, Math.max(h, 0.1), z);
      }
    }
  }
  return new THREE.Vector3(0, 1, 0);
}

interface PlayerProps {
  onPositionChange: (pos: THREE.Vector3) => void;
  onFish: () => void;
  fishingState: 'idle' | 'casting' | 'waiting' | 'caught';
  setFishingState: (state: 'idle' | 'casting' | 'waiting' | 'caught') => void;
  onShowCatchAnim: (fishName: string) => void;
}

const FISH_NAMES = [
  'Bass', 'Trout', 'Salmon', 'Catfish', 'Pike', 'Perch', 'Carp', 'Bluegill',
  'Sunfish', 'Walleye', 'Sturgeon', 'Eel', 'Goldfish', 'Koi', 'Tuna',
];

export default function Player({ onPositionChange, onFish, fishingState, setFishingState, onShowCatchAnim }: PlayerProps) {
  const playerRef = useRef<THREE.Group>(null);
  const rodRef = useRef<THREE.Group>(null);
  const bobberRef = useRef<THREE.Mesh>(null);
  const spawnPos = useRef(findSafeSpawn());
  const posRef = useRef(spawnPos.current.clone());
  const keysRef = useRef<Set<string>>(new Set());
  const facingRef = useRef(0);
  const fishTimerRef = useRef(0);
  const lastChunkRef = useRef('');
  const catchAnimRef = useRef(0);

  const [bobberPos, setBobberPos] = useState<THREE.Vector3 | null>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    keysRef.current.add(e.key.toLowerCase());
    if (e.key.toLowerCase() === 'f' && fishingState === 'idle') {
      const pos = posRef.current;
      const checkDist = 3;
      // Eyes face +Z in local space, so forward is the facing direction
      const dir = new THREE.Vector3(Math.sin(facingRef.current), 0, Math.cos(facingRef.current));
      const targetX = pos.x + dir.x * checkDist;
      const targetZ = pos.z + dir.z * checkDist;
      if (isWater(targetX, targetZ)) {
        setFishingState('casting');
        setBobberPos(new THREE.Vector3(targetX, 0.05, targetZ));
        fishTimerRef.current = 0;
        setTimeout(() => setFishingState('waiting'), 500);
      }
    }
    if (e.key.toLowerCase() === 'f' && fishingState === 'waiting') {
      setFishingState('idle');
      setBobberPos(null);
    }
    if (e.key.toLowerCase() === 'f' && fishingState === 'caught') {
      const fishName = FISH_NAMES[Math.floor(Math.random() * FISH_NAMES.length)];
      onFish();
      onShowCatchAnim(fishName);
      catchAnimRef.current = 1.5; // 1.5 seconds of celebration
      setFishingState('idle');
      setBobberPos(null);
    }
  }, [fishingState, setFishingState, onFish, onShowCatchAnim]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    keysRef.current.delete(e.key.toLowerCase());
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  useFrame((_, delta) => {
    if (!playerRef.current) return;
    const keys = keysRef.current;
    const speed = 8;
    const moving = fishingState === 'idle' && catchAnimRef.current <= 0;

    // Catch celebration countdown
    if (catchAnimRef.current > 0) {
      catchAnimRef.current -= delta;
      // Jump animation during celebration
      const jumpPhase = Math.sin((1.5 - catchAnimRef.current) * 8) * 0.5;
      playerRef.current.position.y = posRef.current.y + Math.max(0, jumpPhase);
    }

    if (moving) {
      const moveDir = new THREE.Vector3();
      if (keys.has('w') || keys.has('arrowup')) moveDir.z -= 1;
      if (keys.has('s') || keys.has('arrowdown')) moveDir.z += 1;
      if (keys.has('a') || keys.has('arrowleft')) moveDir.x -= 1;
      if (keys.has('d') || keys.has('arrowright')) moveDir.x += 1;

      if (moveDir.lengthSq() > 0) {
        moveDir.normalize();

        const newX = posRef.current.x + moveDir.x * speed * delta;
        const newZ = posRef.current.z + moveDir.z * speed * delta;

        if (!isWater(newX, newZ)) {
          posRef.current.x = newX;
          posRef.current.z = newZ;
          facingRef.current = Math.atan2(moveDir.x, moveDir.z);
        }
      }
    }

    // Terrain following
    const h = getTerrainHeight(posRef.current.x, posRef.current.z);
    posRef.current.y = Math.max(h, 0.1);

    if (catchAnimRef.current <= 0) {
      playerRef.current.position.copy(posRef.current);
    } else {
      playerRef.current.position.x = posRef.current.x;
      playerRef.current.position.z = posRef.current.z;
    }
    playerRef.current.rotation.y = facingRef.current;

    // Update camera tracking every frame
    onPositionChange(posRef.current.clone());

    // Fish bite timer
    if (fishingState === 'waiting') {
      fishTimerRef.current += delta;
      if (fishTimerRef.current > 2 + Math.random() * 3) {
        setFishingState('caught');
        fishTimerRef.current = 0;
      }
    }

    // Bobber animation
    if (bobberRef.current && bobberPos) {
      bobberRef.current.position.copy(bobberPos);
      if (fishingState === 'caught') {
        bobberRef.current.position.y = Math.sin(Date.now() * 0.02) * 0.15;
      } else {
        bobberRef.current.position.y = Math.sin(Date.now() * 0.003) * 0.03 + 0.05;
      }
    }
  });

  return (
    <>
      <group ref={playerRef} position={[5, 0, 5]}>
        {/* Body */}
        <mesh position={[0, 0.7, 0]} castShadow>
          <capsuleGeometry args={[0.3, 0.6, 4, 8]} />
          <meshToonMaterial color="#f4a460" />
        </mesh>
        {/* Head */}
        <mesh position={[0, 1.5, 0]} castShadow>
          <sphereGeometry args={[0.35, 8, 8]} />
          <meshToonMaterial color="#ffe4c4" />
        </mesh>
        {/* Eyes - facing +Z (forward direction) */}
        <mesh position={[-0.12, 1.55, 0.28]}>
          <sphereGeometry args={[0.06, 6, 6]} />
          <meshBasicMaterial color="#2d2d2d" />
        </mesh>
        <mesh position={[0.12, 1.55, 0.28]}>
          <sphereGeometry args={[0.06, 6, 6]} />
          <meshBasicMaterial color="#2d2d2d" />
        </mesh>
        {/* Hat */}
        <mesh position={[0, 1.85, 0]}>
          <cylinderGeometry args={[0.4, 0.35, 0.25, 8]} />
          <meshToonMaterial color="#5b8c5a" />
        </mesh>
        <mesh position={[0, 1.75, 0]}>
          <cylinderGeometry args={[0.55, 0.55, 0.05, 8]} />
          <meshToonMaterial color="#5b8c5a" />
        </mesh>
        {/* Fishing Rod (when fishing) */}
        {fishingState !== 'idle' && (
          <group ref={rodRef} position={[0.4, 1.0, 0.2]} rotation={[-0.5, 0, 0.3]}>
            <mesh>
              <cylinderGeometry args={[0.03, 0.02, 2.5, 4]} />
              <meshToonMaterial color="#8B4513" />
            </mesh>
          </group>
        )}
      </group>
      {/* Bobber */}
      {bobberPos && (
        <mesh ref={bobberRef} position={bobberPos}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshToonMaterial color="#ff4444" />
        </mesh>
      )}
    </>
  );
}
