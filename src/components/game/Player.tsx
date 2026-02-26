import { useRef, useEffect, useCallback, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { getTerrainHeight, isWater } from '@/lib/noise';

interface PlayerProps {
  onPositionChange: (pos: THREE.Vector3) => void;
  onFish: () => void;
  fishingState: 'idle' | 'casting' | 'waiting' | 'caught';
  setFishingState: (state: 'idle' | 'casting' | 'waiting' | 'caught') => void;
}

export default function Player({ onPositionChange, onFish, fishingState, setFishingState }: PlayerProps) {
  const playerRef = useRef<THREE.Group>(null);
  const rodRef = useRef<THREE.Group>(null);
  const bobberRef = useRef<THREE.Mesh>(null);
  const posRef = useRef(new THREE.Vector3(5, 0, 5));
  const velRef = useRef(new THREE.Vector3());
  const keysRef = useRef<Set<string>>(new Set());
  const facingRef = useRef(0);
  const fishTimerRef = useRef(0);
  const { camera } = useThree();

  const [bobberPos, setBobberPos] = useState<THREE.Vector3 | null>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    keysRef.current.add(e.key.toLowerCase());
    if (e.key.toLowerCase() === 'f' && fishingState === 'idle') {
      // Check if near water
      const pos = posRef.current;
      const checkDist = 3;
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
      // Reel in - miss
      setFishingState('idle');
      setBobberPos(null);
    }
    if (e.key.toLowerCase() === 'f' && fishingState === 'caught') {
      onFish();
      setFishingState('idle');
      setBobberPos(null);
    }
  }, [fishingState, setFishingState, onFish]);

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
    const moving = fishingState === 'idle';

    if (moving) {
      const moveDir = new THREE.Vector3();
      if (keys.has('w') || keys.has('arrowup')) moveDir.z -= 1;
      if (keys.has('s') || keys.has('arrowdown')) moveDir.z += 1;
      if (keys.has('a') || keys.has('arrowleft')) moveDir.x -= 1;
      if (keys.has('d') || keys.has('arrowright')) moveDir.x += 1;

      if (moveDir.lengthSq() > 0) {
        moveDir.normalize();
        // Move relative to camera
        const camAngle = Math.atan2(
          camera.position.x - posRef.current.x,
          camera.position.z - posRef.current.z
        );
        const rotated = new THREE.Vector3(
          moveDir.x * Math.cos(camAngle) - moveDir.z * Math.sin(camAngle),
          0,
          moveDir.x * Math.sin(camAngle) + moveDir.z * Math.cos(camAngle)
        );

        const newX = posRef.current.x + rotated.x * speed * delta;
        const newZ = posRef.current.z + rotated.z * speed * delta;

        // Don't walk into water
        if (!isWater(newX, newZ)) {
          posRef.current.x = newX;
          posRef.current.z = newZ;
          facingRef.current = Math.atan2(rotated.x, rotated.z);
        }
      }
    }

    // Terrain following
    const h = getTerrainHeight(posRef.current.x, posRef.current.z);
    posRef.current.y = Math.max(h, 0.1);

    playerRef.current.position.copy(posRef.current);
    playerRef.current.rotation.y = facingRef.current;

    // Camera follow
    const camDist = 15;
    const camHeight = 10;
    const idealCamPos = new THREE.Vector3(
      posRef.current.x + Math.sin(facingRef.current + Math.PI) * camDist,
      posRef.current.y + camHeight,
      posRef.current.z + Math.cos(facingRef.current + Math.PI) * camDist
    );
    camera.position.lerp(idealCamPos, 0.05);
    camera.lookAt(posRef.current.x, posRef.current.y + 1, posRef.current.z);

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
        {/* Eyes */}
        <mesh position={[-0.12, 1.55, -0.28]}>
          <sphereGeometry args={[0.06, 6, 6]} />
          <meshBasicMaterial color="#2d2d2d" />
        </mesh>
        <mesh position={[0.12, 1.55, -0.28]}>
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
          <group ref={rodRef} position={[0.4, 1.0, -0.2]} rotation={[0.5, 0, 0.3]}>
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
